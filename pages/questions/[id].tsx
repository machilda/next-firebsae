import {useEffect, useState, FormEvent} from 'react';
import { useRouter } from "next/router";
import  firebase from 'firebase/app';
import Layout from "../../components/Layout";
import { Question } from "../../models/Question";
import { Answer } from "../../models/Answer";
import { useAuthentication } from '../../hooks/authentication';
import { toast } from 'react-toastify';


type Query = {
    id:string
}

export default function QuestionShow (){
    const router = useRouter()
    const query = router.query as Query
    const {user} = useAuthentication()
    const [question, setQuestion] = useState<Question>(null)

    const [body, setBody] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [answer, setAnswer] = useState<Answer>(null)

    async function loadData() {
        if(query.id === undefined) return
        const questionDoc = await firebase.firestore().collection('questions').doc(query.id).get()
        console.log(questionDoc,'questionDoc');
        
        if(!questionDoc.exists) return 
        
        const getQuestion= questionDoc.data() as Question
        getQuestion.id = questionDoc.id
        setQuestion(getQuestion)

        if(!getQuestion.isReplied) return
        const answerSnapshot = await firebase
            .firestore()
            .collection('answers')
            .where('questionId', '==', getQuestion.id)
            .limit(1)
            .get()

        if (answerSnapshot.empty) return
        const getAnswer = answerSnapshot.docs[0].data() as Answer
        getAnswer.id = answerSnapshot.docs[0].id
        console.log(getAnswer,'getAnswer');
        
        setAnswer(getAnswer)
    }

    useEffect(()=>{
        if (user === null) {
            return
        }        
        loadData()
    },[query.id, user])

    async function onSubmit(e:FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsSending(true)

        const answerRef = firebase.firestore().collection('answers').doc()


        await firebase.firestore().runTransaction(async(t)=>{
            t.set(answerRef,{
                uid: user.uid,
                questionId: question.id,
                body,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            })
            t.update(firebase.firestore().collection('questions').doc(question.id),{
                isReplied: true,
            })
        })

        const now = new Date().getTime()
        setAnswer({
            id: answerRef.id,
            uid: user.uid,
            questionId: question.id,
            body,
            createdAt: new firebase.firestore.Timestamp(now / 1000, now % 1000),
        })

        setBody('')
        setIsSending(false)

        toast.success('回答を送信しました。', {
            position: 'bottom-left',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          }
        )
    }

    return (
        <Layout>
            <div className="row justify-content-center">
            <div className="col-12 col-md-6">
                {question && (
                    <>
                    <div className="card">
                        <div className="card-body">{question.body}</div>
                    </div>

                    <section className="text-center mt-4">
                        <h2 className="h4">回答</h2>

                        {answer === null ? (
                        <form onSubmit={onSubmit}>
                            <textarea
                            className="form-control"
                            placeholder="おげんきですか？"
                            rows={6}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            required
                            ></textarea>
                            <div className="m-3">
                            {isSending ? (
                                <div
                                className="spinner-border text-secondary"
                                role="status"
                                ></div>
                            ) : (
                                <button type="submit" className="btn btn-primary">
                                回答する
                                </button>
                            )}
                            </div>
                        </form>
                        ) : (
                        <div className="card">
                            <div className="card-body text-left">{answer.body}</div>
                        </div>
                        )}
                    </section>
                    </>
                )}
                </div>
            </div>
        </Layout>
    )
}
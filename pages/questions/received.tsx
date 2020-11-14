import { useState,useEffect, useRef } from "react";
import { Question } from "../../models/Question";
import Layout from "../../components/Layout";
import {useAuthentication} from "../../hooks/authentication";
import firebase from "firebase/app";
import dayjs from 'dayjs'
import Link from "next/link";

export default function QuestionReceived(){
    const [questions, setQuestion] = useState<Question[]>([])
    const [isPaginationFinished, setIsPaginationFinished] = useState(false)

    const {user} = useAuthentication()
    const scrollContainerRef = useRef(null)

    useEffect(()=>{
        window.addEventListener('scroll', onScroll)
        return () => {
            window.removeEventListener('scroll', onScroll)
        }
    },[questions, scrollContainerRef.current, isPaginationFinished])

    useEffect(() => {
        async function load() {
            if (!process.browser) return
            if (user === null)  return
            await loadQuestions()
            onScroll()
        }
        load()
    }, [process.browser, user])

    function createBaseQuery(){
        return firebase.firestore().collection('questions').where('receiverUid', '==', user.uid).orderBy('createdAt', 'desc').limit(10)
    }
    
    function appendQuestions(snapshot: firebase.firestore.QuerySnapshot<firebase.firestore.DocumentData>){
        console.log('appendQuestions');
        const getQuestions = snapshot.docs.map(doc=>{
            const question = doc.data() as Question            
            question.id = doc.id
            return question
        })
        setQuestion(questions.concat(getQuestions))
    }

    async function loadQuestions() {        
        const snapshot = await createBaseQuery().get()
        console.log(snapshot);
        
        if(snapshot.empty) {
            setIsPaginationFinished(true)
            return
        }
        appendQuestions(snapshot)
    }

    async function loadNextQuestions() {
        console.log('loadNextQuestions',questions);

        if(questions.length === 0) return
        const lastQustion = questions[questions.length -1]
        const snapshot = await createBaseQuery().startAfter(lastQustion.createdAt).get()
        if(snapshot.empty) {
            setIsPaginationFinished(true)
            return
        }
        appendQuestions(snapshot)
    }

    function onScroll() {        
        if (isPaginationFinished) return

        const container = scrollContainerRef.current
        if (container === null) return

        const rect = container.getBoundingClientRect()
        
        console.log(rect.top + rect.height > window.innerHeight,'rect.top + rect.height > window.innerHeight');
        
        if (rect.top + rect.height > window.innerHeight) return

        loadNextQuestions()
    }

    return (
        <Layout>
            <h1 className="h4"></h1>
            <div className="row justify-content-center">
            <div className="col-12 col-md-6" ref={scrollContainerRef}>
                {questions.map((question) => (
                    <Link href="/questions/[id]" as={`/questions/${question.id}`} key={question.id}>
                        <a>
                            <div className="card my-4" key={question.id}>
                                <div className="card-body">
                                    <div className="text-truncate">{question.body}</div>
                                    <div className="text-muted text-right">
                                        <small>{dayjs(question.createdAt.toDate()).format('YYYY/MM/DD HH:mm')}</small>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </Link>
                ))}
            </div>
            </div>
        </Layout>
    )
}
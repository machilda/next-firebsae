import Head from "next/head";
import Link from "next/link";
import { useAuthentication } from "../hooks/authentication";

export default function Home(){
    const {user} = useAuthentication()
    return(
        <>
            <Head>
                <title>page2</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <p>{user?.uid || '未ログイン'}</p>
            <Link href='/'>
                <a>Go back</a>
            </Link>
        </>
    )
}
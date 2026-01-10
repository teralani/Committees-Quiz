import Link from "next/link"
export default function Page() {
    return (<div>
        <Link href="/login">
            <p>
                Sign in
            </p>
        </Link>
    </div>)
}
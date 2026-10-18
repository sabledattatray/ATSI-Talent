"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="talent-container talent-narrow"><h1>We couldn’t load this page.</h1><p>Please try again. If the issue continues, contact the team with the page address.</p><div className="talent-actions"><button className="talent-button" onClick={reset}>Try again</button><Link className="talent-button talent-secondary" href="/contact">Contact the team</Link></div></div>; }

import Image from "next/image";

import { AuditConsole } from "../components/AuditConsole";

export default function HomePage() {
  return (
    <main className="audit-page">
      <h1>
        <Image
          className="audit-brand-mark"
          src="/brand/pawsift-mark-512-v2.png"
          alt=""
          aria-hidden="true"
          width={32}
          height={32}
          priority
        />
        <span>PawSift</span>
      </h1>
      <div id="audit-console-root" aria-hidden="true" />
      <AuditConsole />
    </main>
  );
}

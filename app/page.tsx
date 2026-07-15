import Image from "next/image";

import { AuditConsole } from "../components/AuditConsole";

export default function HomePage() {
  return (
    <main className="audit-page">
      <h1>
        <Image
          className="audit-brand-logo"
          src="/brand/pawsift-logo-512-v2.png"
          alt="PawSift"
          width={112}
          height={37}
          priority
        />
      </h1>
      <div id="audit-console-root" aria-hidden="true" />
      <AuditConsole />
    </main>
  );
}

import { AuditConsole } from "../components/AuditConsole";

export default function HomePage() {
  return (
    <main className="audit-page">
      <h1>PawSift</h1>
      <div id="audit-console-root" aria-hidden="true" />
      <AuditConsole />
    </main>
  );
}

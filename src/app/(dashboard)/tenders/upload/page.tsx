import { TenderUpload } from "@/components/tender/TenderUpload";

export default function TenderUploadPage() {
  return (
    <main className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        رفع منافسات — إتمام
      </h1>
      <TenderUpload />
    </main>
  );
}

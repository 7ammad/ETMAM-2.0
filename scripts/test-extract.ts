import fs from "fs";
import { getAIProvider } from "../src/lib/ai/provider";

async function main() {
  const filePath = "C:\\Users\\7amma\\Downloads\\demo-260139005990.pdf";
  console.log(`Loading file: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const buffer = fs.readFileSync(filePath);
  console.log(`File loaded. Size: ${buffer.length} bytes`);

  try {
    const provider = await getAIProvider("gemini");
    console.log("Provider initialized. Starting extraction with lean=true...");

    const result = await provider.extractFromPDF(buffer, "demo.pdf", { lean: true });

    console.log("Extraction completed successfully!");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Extraction failed:");
    console.error(error);
  }
}

main().catch(console.error);

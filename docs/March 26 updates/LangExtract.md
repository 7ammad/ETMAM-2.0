### What is LangExtract?

**LangExtract** is an open-source Python library developed by Google that uses Large Language Models (LLMs)—primarily Google's Gemini—to pull clean, structured data out of messy, unstructured text.

Instead of writing complex regular expressions or custom parsing code, developers can simply give LangExtract natural language instructions and a few examples of the desired output. The AI then reads the text and extracts exactly what you need, organizing it into a usable format like JSON.

### Key Features

* **Precise Source Grounding:** This is arguably its most important feature. LangExtract doesn't just return the data; it maps every single extracted entity back to its exact location in the original source document. This drastically reduces LLM "hallucinations" and provides complete auditability.
* **Long Document Optimization:** It solves the AI "needle-in-a-haystack" problem for large files. It uses smart chunking (splitting text logically by sentences or paragraphs rather than strict character limits), parallel processing, and multiple extraction passes to ensure high accuracy over massive documents.
* **Interactive Visualization:** It automatically generates interactive HTML reports.  You can open these in a web browser to review your original text with all the extracted entities and relationships cleanly highlighted in context.
* **No Fine-Tuning Required:** You define your extraction rules using simple prompts and "few-shot" examples (providing a couple of sample inputs and expected outputs). It adapts to highly specialized domains without requiring you to retrain the underlying AI model.
* **Model Flexibility:** While it is optimized for Google's Gemini models, it is model-agnostic. It supports other cloud providers like OpenAI and can even run entirely locally for privacy compliance using tools like Ollama.

### Common Use Cases

Because of its strict traceability, LangExtract shines in regulated, data-heavy industries:

* **Healthcare:** Extracting medications, dosages, and patient history from unstructured clinical notes or structuring free-text radiology reports.
* **Legal & Finance:** Pulling specific clauses, dates, and financial obligations from lengthy contracts or risk assessment documents.
* **Research:** Rapidly extracting entities and relationships from thousands of academic papers.

Would you like me to show you a quick Python code example of how it works, or dive deeper into how it handles large documents?
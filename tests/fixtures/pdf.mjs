import { deflateSync } from "node:zlib";

export function pdfFixture(lines) {
  // A valid PDF with hex text and a compressed stream: unsupported by the old reader.
  const content=Buffer.from("BT /F1 12 Tf 50 780 Td 16 TL\n"+lines.map(s=>`<${Buffer.from(s,"latin1").toString("hex")}> Tj T*`).join("\n")+"\nET");
  const zip=deflateSync(content);
  const objects=["<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [3 0 R] /Count 1 >>","<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>","<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",Buffer.concat([Buffer.from(`<< /Length ${zip.length} /Filter /FlateDecode >>\nstream\n`),zip,Buffer.from("\nendstream")])];
  const chunks=[Buffer.from("%PDF-1.4\n")],offsets=[0];let size=chunks[0].length;
  for(let i=0;i<objects.length;i++){offsets.push(size);const chunk=Buffer.concat([Buffer.from(`${i+1} 0 obj\n`),Buffer.isBuffer(objects[i])?objects[i]:Buffer.from(objects[i]),Buffer.from("\nendobj\n")]);chunks.push(chunk);size+=chunk.length;}
  chunks.push(Buffer.from(`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(o=>`${String(o).padStart(10,"0")} 00000 n \n`).join("")+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${size}\n%%EOF`));return Buffer.concat(chunks);
}

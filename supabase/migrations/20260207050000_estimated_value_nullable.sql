-- Make estimated_value nullable.
-- Saudi tender PDFs rarely include the price (bidders fill it in).
-- PDF-extracted tenders need to save without a value.
ALTER TABLE tenders ALTER COLUMN estimated_value DROP NOT NULL;

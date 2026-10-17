-- Repair dead Amazon short URL for Jessie Hardin's existing book.
-- Preserve the product, artwork, catalog ID, sales policy, and all prior migrations.
UPDATE store_products
SET external_url = 'https://www.amazon.com/dp/B0HJJT8NQY',
    source_note = 'Author-owned Amazon paperback listing, ISBN 9798173450265; corrected from expired short URL.'
WHERE id = 'mkt_book_holy_spirit'
  AND product_kind = 'external'
  AND external_url = 'https://a.co/d/02rFwv8H';

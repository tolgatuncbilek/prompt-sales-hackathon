INSERT INTO "service_catalog" ("id", "name", "service_type", "is_third_party", "retired", "created_at")
SELECT 'c1a2b3c4-d5e6-4789-a012-3456789abcde', 'Technical compatibility', 'Validation', false, false, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "service_catalog" WHERE "name" = 'Technical compatibility'
);

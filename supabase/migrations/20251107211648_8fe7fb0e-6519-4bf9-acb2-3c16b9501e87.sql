-- Delete all the default spaces that were auto-created
DELETE FROM spaces 
WHERE name IN (
  'Second Brain',
  'OSS',
  'Artificial Intelligence',
  'Brainboard Competitors',
  'Visualize Terraform',
  'CI/CD Engine',
  'UXUI',
  'Space',
  'Cloud Computing'
);
ALTER TABLE characters
    ADD COLUMN IF NOT EXISTS skill_proficiencies TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS save_proficiencies TEXT[] DEFAULT '{}';
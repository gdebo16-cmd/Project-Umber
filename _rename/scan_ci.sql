with m as (select b.id, b.name old, s.name new from spells_backup_2026_10_22 b join spells s using(id) where b.name<>s.name),
t as (
 select 'classes' tb, id, 'description' col, description txt from classes union all
 select 'classes', id, 'spellcasting', spellcasting from classes union all
 select 'class_features', id, 'description', description from class_features union all
 select 'class_features', id, 'name', name from class_features union all
 select 'class_feature_options', id, 'description', description from class_feature_options union all
 select 'class_feature_options', id, 'name', name from class_feature_options union all
 select 'class_levels', id, 'description', description from class_levels union all
 select 'sub_classes', id, 'description', description from sub_classes union all
 select 'sub_classes', id, 'spellcasting', spellcasting from sub_classes union all
 select 'sub_classes', id, 'breach_effect', breach_effect from sub_classes union all
 select 'subclass_features', id, 'description', description from subclass_features union all
 select 'subclass_features', id, 'name', name from subclass_features union all
 select 'subclass_levels', id, 'description', description from subclass_levels union all
 select 'primordial_blessings', id, 'description', description from primordial_blessings union all
 select 'race_lineage_bonuses', id, 'description', description from race_lineage_bonuses union all
 select 'races', id, 'traits', traits from races union all
 select 'subraces', id, 'description', description from subraces union all
 select 'runes', id, 'effect', effect from runes union all
 select 'items', id, 'description', description from items
)
select t.tb, t.id, t.col, m.old, m.new, substring(t.txt from greatest(1, position(lower(m.old) in lower(t.txt))-40) for length(m.old)+80) ctx
from t join m on t.txt ~* ('\m' || regexp_replace(m.old,'([.^$*+?()\[\]{}|\\])','\\\1','g') || '\M')
where t.tb not in ('items','subraces','runes') and m.old not in ('Resistance','Shield','Gate','Light','Command','Blight','Silence','Sanctuary','Mending','Fear','Resurrection','Darkvision','Teleport','Blur','Haste','Augury','Barkskin','Hunter''s Mark') order by 1,2,3;
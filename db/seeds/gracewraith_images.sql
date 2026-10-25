-- Gracewraith art paths (class 15, subclasses 47-49). Safe to re-run.
UPDATE classes SET img_url = '/classes/wraith.png' WHERE id = 15;
UPDATE sub_classes SET img_url = '/subclasses/' || v.file
FROM (VALUES (47, 'sub-wraith-archon.png'), (48, 'sub-wraith-seraph.png'), (49, 'sub-wraith-virtue.png')) AS v(id, file)
WHERE sub_classes.id = v.id AND sub_classes.class_id = 15;

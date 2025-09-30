import re
from pathlib import Path

path = Path('src/routes/quotes-router.js')
text = path.read_text(encoding='utf8')
pattern = re.compile(r"\n\n    let equipmentImagePath = req.body.existing_equipment_image \|\| req.body.equipment_image_url \|\| null;\r?\n    if \(req.files && req.files.length > 0\) {\r?\n      const imageFile = req.files.find\(f => f.fieldname === 'equipment_image'\);\r?\n      if \(imageFile\) {\r?\n        const baseUrl = `\$\{req.protocol\}://\$\{req.get\('host'\)\}`;\r?\n        equipmentImagePath = `\$\{baseUrl\}/uploads/\$\{imageFile.filename\}`;\r?\n      }\r?\n    }\r?\n\r?\n")
text, count = pattern.subn('\n\n', text)
if count:
    path.write_text(text, encoding='utf8')

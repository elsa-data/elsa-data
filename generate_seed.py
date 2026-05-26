# Script to generate edgedb data load script from directories created on NCI
import os
import json

base_dir = '/g/data/eh28/globus/demo/share/'
commercial_dir = os.path.join(base_dir, 'commercial')
noncommercial_dir = os.path.join(base_dir, 'noncommercial')

samples_data = []

for i in range (1, 101):
    sample = f"SAMPLE{i:03d}"

    if os.path.exists(os.path.join(commercial_dir, f"{sample}.bam")):
        sub_dir = "commercial"
        local_dir_path = commercial_dir
        # General Research use (no modifiers)
        duo_json = {
            "code": "DUO:0000042",
            "modifiers": []
        }
    elif os.path.exists(os.path.join(noncommercial_dir, f"{sample}.bam")):
        sub_dir = "noncommercial"
        local_dir_path = noncommercial_dir
        # Non-commercial: General Research Use + Non-Commercial Use Only modifier
        duo_json = {
            "code": "DUO:0000042",
            "modifiers": [ { "code": "DUO:0000046"}]
        }
    else:
        continue

    bam_file_path = os.path.join(local_dir_path, f"{sample}.bam")
    bai_file_path = os.path.join(local_dir_path, f"{sample}.bam.bai")

    bam_size = os.path.getsize(bam_file_path) if os.path.exists(bam_file_path) else 1000000000
    bai_size = os.path.getsize(bai_file_path) if os.path.exists(bai_file_path) else 10000
    
    md5_hash = "TODO"
    md5_file_path = os.path.join(local_dir_path, f"{sample}.bam.md5")

    if os.path.exists(md5_file_path):
        with open(md5_file_path, 'r') as f:
            content = f.read().strip()
            if content:
                md5_hash = content.split()[0]

    samples_data.append({
      "sample_id": sample,
      "sub_dir": sub_dir,
      "duo_json": duo_json,
      "bam_size": bam_size,
      "bai_size": bai_size,
      "md5_hash": md5_hash
    })

with open("globus_data.json", "w") as f:
  json.dump(samples_data, f, indent=2)

print(f"Generated JSON for {len(samples_data)} samples.")

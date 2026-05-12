import json

with open('notebooks/unsloth_finetune_gguf.ipynb', encoding='utf-8') as f:
    nb = json.load(f)

new_source = [
    "merged = model.merge_and_unload()\n",
    "from unsloth import FastLanguageModel\n",
    'FastLanguageModel.save_pretrained_merged(\n',
    '    model, tokenizer, "gemma4_bn_worker_merged",\n',
    '    save_method="merged_16bit",\n',
    ')\n',
    'print("Merged model saved to gemma4_bn_worker_merged/")\n',
]

for i, cell in enumerate(nb['cells']):
    src = ''.join(cell.get('source', []))
    if 'merge_and_unload' in src:
        nb['cells'][i]['source'] = new_source
        break

with open('notebooks/unsloth_finetune_gguf.ipynb', 'w', encoding='utf-8') as f:
    json.dump(nb, f, ensure_ascii=False, indent=1)

print('Fixed merge cell')

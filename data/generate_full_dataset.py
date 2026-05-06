import json
import random
import os

def generate_dataset():
    os.makedirs('data/training', exist_ok=True)
    
    laws = {
        "wage_theft": {"section": "ধারা ১২১", "desc": "বকেয়া বেতন", "advice": "৩ মাস বেতন না পাওয়া আইনের লঙ্ঘন। আপনি ১০ গুণ ক্ষতিপূরণ দাবি করতে পারেন।"},
        "termination": {"section": "ধারা ২৬", "desc": "অবৈধ ছাঁটাই", "advice": "১২০ দিনের নোটিশ বা সমপরিমাণ মজুরি ছাড়া ছাঁটাই করা অবৈধ।"},
        "maternity": {"section": "ধারা ৪৫-৫০", "desc": "মাতৃত্বকালীন ছুটি", "advice": "১৬ সপ্তাহের সবেতন মাতৃত্বকালীন ছুটি আপনার আইনি অধিকার।"},
        "overtime": {"section": "ধারা ১০৮", "desc": "ওভারটাইম মজুরি", "advice": "ওভারটাইমের জন্য মূল মজুরির দ্বিগুণ হারে টাকা পেতে হবে।"},
        "harassment": {"section": "ধারা ৩৩২", "desc": "অশোভন আচরণ", "advice": "কারখানায় গালিগালাজ বা দুর্ব্যবহার দণ্ডনীয় অপরাধ।"},
        "safety": {"section": "ধারা ৬১", "desc": "অগ্নি নিরাপত্তা", "advice": "জরুরি বের হওয়ার পথ বন্ধ রাখা বা অনিরাপদ পরিবেশ বেআইনি।"},
        "drinking_water": {"section": "ধারা ৫৮", "desc": "বিশুদ্ধ পানি", "advice": "পর্যাপ্ত বিশুদ্ধ খাবার পানির ব্যবস্থা থাকা মালিকের বাধ্যবাধকতা।"},
    }

    emotional_states = ["বুকটা ফাইট্টা যায় কষ্টে।", "খুব ডরে আছি ভাই।", "রাগে গা জ্বলতাছে।", "কানতে কানতে চোহের পানি শেষ।"]
    factories = ["মডেল গার্মেন্টস", "এবিসি অ্যাপারেলস", "ইউনিক ফ্যাশন", "সেফটি টেক্সটাইল", "সোনারগাঁও নিটওয়্যার"]
    locations = ["সাভার", "গাজীপুর", "মিরপুর", "নারায়ণগঞ্জ", "আশুলিয়া"]

    pairs = []
    unique_instructions = set()

    target_count = 2000
    while len(pairs) < target_count:
        # 20% chance of a "Clarification" task (Vague input)
        is_clarification = random.random() < 0.2
        
        if is_clarification:
            # Vague scenario
            vague_stories = [
                "মালিক আমারে খেদাই দিছে ভাই, এখন আমি কই যামু?",
                "টিঁয়া পয়সা কিসু দেয় না, খালি খাটায়।",
                "ম্যানেজার খুব খারাপ ব্যবহার করে আমাদের সাথে।",
                "ফ্যাক্টরিতে কাম করতে ডর লাগে, কহন কী হয় আল্লায় জানে।",
                "আমি আর কাম করতে পারতাছি না এই শরীরে, কিসু একটা করেন।"
            ]
            scenario = f"{random.choice(emotional_states)} {random.choice(vague_stories)}"
            
            # Identify what's missing (usually everything)
            output = "আপনার কথা শুনে আমি বুঝতে পারছি আপনি খুব বিপদে আছেন। আপনাকে সঠিক আইনি পরামর্শ দিতে আমার কিছু তথ্য প্রয়োজন:\n\n"
            output += "১. আপনি কতদিন ধরে এই কারখানায় কাজ করছেন?\n"
            output += "২. আপনার কারখানার নাম এবং এটি কোন এলাকায় অবস্থিত?\n"
            output += "৩. আপনার মাসিক বেতন কত ছিল?\n\n"
            output += "এই তথ্যগুলো দিলে আমি আপনাকে শ্রম আইনের সঠিক ধারা অনুযায়ী সাহায্য করতে পারব।"
            task_type = "clarification_required"
            
        else:
            # Full scenario (already implemented)
            primary_issue = random.choice(list(laws.keys()))
            factory = random.choice(factories)
            loc = random.choice(locations)
            tenure = random.randint(1, 15)
            
            scenario = f"{random.choice(emotional_states)} আমি {factory} এ {loc} এলাকায় {tenure} বছর ধইরা কাম করি। "
            scenario += f"এহন সমস্যা হইলো, মালিক আমার {laws[primary_issue]['desc']} দিতাছে না।"
            
            output = f"আপনার তথ্য অনুযায়ী, আপনি {loc} এলাকার {factory}-তে {tenure} বছর ধরে কর্মরত আছেন। আপনার প্রধান সমস্যা হলো {laws[primary_issue]['desc']}।\n\n"
            output += f"বাংলাদেশ শ্রম আইনের {laws[primary_issue]['section']} অনুযায়ী, {laws[primary_issue]['advice']}\n\n"
            output += "প্রতিকার: আপনি কলকারখানা ও প্রতিষ্ঠান পরিদর্শন অধিদপ্তর (DIFE) এ অভিযোগ করতে পারেন।"
            task_type = "complex_scenario_summary"

        if scenario in unique_instructions:
            continue
        unique_instructions.add(scenario)
        pairs.append({"instruction": scenario, "input": "", "output": output, "task_type": task_type})

    with open('data/training/instruction_pairs.jsonl', 'w', encoding='utf-8') as f:
        for p in pairs:
            f.write(json.dumps(p, ensure_ascii=False) + '\n')
            
    print(f"Successfully generated {len(pairs)} entries (including Clarification logic).")

if __name__ == "__main__":
    generate_dataset()

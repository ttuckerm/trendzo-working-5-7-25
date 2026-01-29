import re

# Read the original file
with open('src/app/admin/testing-accuracy/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Read the new Step 1 content
with open('step1_enhanced.txt', 'r', encoding='utf-8') as f:
    new_step1 = f.read()

# Find and replace Step 1 section
# Pattern: from "Step 1: Intake & Freeze" comment to the closing of that step
pattern = r'(\s+\{/\* Step 1: Intake & Freeze \*/\}.*?^\s+\}\))\s*$'

# Find the section
match = re.search(r'(\{/\* Step 1: Intake & Freeze \*/\})(.*?)(\{/\* Step 2: Pattern QA \*/\})', content, re.DOTALL)

if match:
    # Replace the middle part
    new_content = content[:match.start(2)] + '\n' + new_step1 + '\n\n          ' + content[match.start(3):]

    # Write back
    with open('src/app/admin/testing-accuracy/page.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)

    print("OK Step 1 replaced successfully!")
else:
    print("ERROR Could not find Step 1 section")

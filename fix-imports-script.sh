#!/bin/bash

echo "🔧 Final fix for all getAllTransactions corruptions..."
echo "=================================================="

# Fix all number replacements systematically
fix_file() {
    local file=$1
    echo "Fixing: $file"
    
    # Create backup
    cp "$file" "$file.backup"
    
    # Fix all patterns
    sed -i '' \
        -e 's/getAllTransactionsgetAllTransactions/100/g' \
        -e 's/getAllTransactions/0/g' \
        -e 's/0getAll0/100/g' \
        -e 's/getAll0/0/g' \
        -e 's/0get0/00/g' \
        -e 's/1getAllTransactions/10/g' \
        -e 's/2getAllTransactions/20/g' \
        -e 's/3getAllTransactions/30/g' \
        -e 's/4getAllTransactions/40/g' \
        -e 's/5getAllTransactions/50/g' \
        -e 's/6getAllTransactions/60/g' \
        -e 's/7getAllTransactions/70/g' \
        -e 's/8getAllTransactions/80/g' \
        -e 's/9getAllTransactions/90/g' \
        -e 's/getAllTransactions0/0/g' \
        -e 's/0getAllTransactions0/00/g' \
        -e 's/getAllTransactions32/032/g' \
        -e 's/getAllTransactions8/08/g' \
        -e 's/getAllTransactions1/01/g' \
        -e 's/getAllTransactions,/0,/g' \
        -e 's/getAllTransactions;/0;/g' \
        -e 's/getAllTransactions)/0)/g' \
        -e 's/(getAllTransactions/(0/g' \
        -e 's/\.getAllTransactions/.0/g' \
        -e 's/ getAllTransactions / 0 /g' \
        -e 's/getAllTransactions$/0/g' \
        -e 's/^getAllTransactions/0/g' \
        -e 's/"getAllTransactions"/"0"/g' \
        -e "s/'getAllTransactions'/'0'/g" \
        -e 's/= getAllTransactions/= 0/g' \
        -e 's/getAllTransactions}/0}/g' \
        -e 's/{getAllTransactions/{0/g' \
        -e 's/\[getAllTransactions\]/[0]/g' \
        -e 's/px getAllTransactions/px 0/g' \
        -e 's/getAllTransactionspx/0px/g' \
        -e 's/: getAllTransactions/: 0/g' \
        -e 's/getAllTransactions:/0:/g' \
        -e 's/div getAllTransactions/div 0/g' \
        -e 's/limit(getAllTransactions)/limit(0)/g' \
        "$file"
    
    # Remove backup if successful
    if [ $? -eq 0 ]; then
        rm "$file.backup"
    else
        echo "  ⚠️  Error fixing $file"
        mv "$file.backup" "$file"
    fi
}

# Fix specific files mentioned in the error
echo -e "\n📋 Fixing specific files with errors..."

# Dashboard.jsx specific fixes
fix_file "src/components/dashboard/Dashboard.jsx"
sed -i '' 's/totalProfit: 0/totalProfit: 0/g' src/components/dashboard/Dashboard.jsx
sed -i '' 's/limit(0)/limit(10)/g' src/components/dashboard/Dashboard.jsx
sed -i '' 's/maximumFractionDigits: 0/maximumFractionDigits: 0/g' src/components/dashboard/Dashboard.jsx
sed -i '' 's/\* 100/\* 100/g' src/components/dashboard/Dashboard.jsx

# ProjectCard.jsx specific fixes
fix_file "src/components/projects/ProjectCard.jsx"
sed -i '' 's/taxRate \/ 100/taxRate \/ 100/g' src/components/projects/ProjectCard.jsx

# ProjectDetail.jsx specific fixes  
fix_file "src/components/projects/ProjectDetail.jsx"
sed -i '' 's/taxRate \/ 100/taxRate \/ 100/g' src/components/projects/ProjectDetail.jsx

# ReportCharts.jsx specific fixes
fix_file "src/components/reports/ReportCharts.jsx"
sed -i '' 's/value: 0/value: 0/g' src/components/reports/ReportCharts.jsx
sed -i '' 's/borderWidth: 0/borderWidth: 0/g' src/components/reports/ReportCharts.jsx
sed -i '' 's/slice(0, 10)/slice(0, 10)/g' src/components/reports/ReportCharts.jsx
sed -i '' 's/\* 100/\* 100/g' src/components/reports/ReportCharts.jsx
sed -i '' 's/height: '\''400px'\''/height: '\''400px'\''/g' src/components/reports/ReportCharts.jsx

# Reports.jsx specific fixes
fix_file "src/components/reports/Reports.jsx"
sed -i '' 's/\* 100/\* 100/g' src/components/reports/Reports.jsx

# index.js specific fixes
fix_file "src/index.js"
sed -i '' 's/opacity = '\''0'\''/opacity = '\''0'\''/g' src/index.js
sed -i '' 's/}, 100);/}, 100);/g' src/index.js
sed -i '' 's/}, 100);/}, 100);/g' src/index.js

# formatters.js specific fixes
fix_file "src/utils/formatters.js"
sed -i '' 's/maximumFractionDigits: 0/maximumFractionDigits: 0/g' src/utils/formatters.js
sed -i '' 's/\* 1000/\* 1000/g' src/utils/formatters.js
sed -i '' 's/\* 100), 100/\* 100), 100/g' src/utils/formatters.js
sed -i '' 's/(1000 \*/\(1000 \*/g' src/utils/formatters.js
sed -i '' 's/Math.max(0,/Math.max(0,/g' src/utils/formatters.js
sed -i '' 's/substring(0,/substring(0,/g' src/utils/formatters.js

# sharing.js specific fixes  
fix_file "src/utils/sharing.js"
sed -i '' 's/taxRate \/ 100/taxRate \/ 100/g' src/utils/sharing.js
sed -i '' 's/style.top = "0"/style.top = "0"/g' src/utils/sharing.js
sed -i '' 's/style.left = "0"/style.left = "0"/g' src/utils/sharing.js

# Fix all remaining files
echo -e "\n📋 Fixing all remaining files..."
find src/ -type f \( -name "*.js" -o -name "*.jsx" \) -exec grep -l "getAllTransactions" {} \; | while read file; do
    if [[ ! "$file" =~ "services/transactions.js" ]]; then
        fix_file "$file"
    fi
done

# Final verification
echo -e "\n📋 Final verification..."
remaining=$(find src/ -type f \( -name "*.js" -o -name "*.jsx" \) -exec grep -l "getAllTransactions" {} \; | grep -v "services/transactions.js" | wc -l)

if [ $remaining -eq 0 ]; then
    echo "✅ All getAllTransactions corruptions have been fixed!"
else
    echo "⚠️  Still found $remaining files with getAllTransactions:"
    find src/ -type f \( -name "*.js" -o -name "*.jsx" \) -exec grep -l "getAllTransactions" {} \; | grep -v "services/transactions.js"
fi

echo -e "\n✅ Fix complete! Now run:"
echo "rm -rf node_modules/.cache"
echo "npm run build"
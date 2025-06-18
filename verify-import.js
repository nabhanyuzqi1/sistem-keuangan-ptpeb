// verify-imports.js
// Comprehensive Service Layer Import Verification System

const fs = require('fs');
const path = require('path');

console.log('🔍 Initiating Comprehensive Import/Export Analysis...\n');

/**
 * Architectural Verification Framework
 * Ensures complete service layer interface integrity
 */
class ServiceLayerVerifier {
  constructor() {
    this.services = ['auth', 'projects', 'transactions', 'ai'];
    this.requiredExports = {
      auth: ['signInUser', 'signOutUser', 'getCurrentUserWithRole', 'onAuthStateChange'],
      projects: ['addProject', 'updateProject', 'deleteProject', 'getAllProjects', 'getProjectById'],
      transactions: ['addTransaction', 'updateTransaction', 'deleteTransaction', 'getAllTransactions', 'getTransactionsByProject'],
      ai: ['analyzeTransactionImage', 'validateImageFile', 'uploadTransactionImage']
    };
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Execute comprehensive verification protocol
   */
  async verify() {
    console.log('📋 Service Layer Verification Protocol Initiated\n');
    
    for (const service of this.services) {
      await this.verifyService(service);
    }
    
    this.generateReport();
  }

  /**
   * Verify individual service module
   */
  async verifyService(serviceName) {
    const servicePath = path.join(__dirname, 'src', 'services', `${serviceName}.js`);
    
    console.log(`\n🔧 Analyzing ${serviceName} service...`);
    
    if (!fs.existsSync(servicePath)) {
      this.errors.push({
        service: serviceName,
        type: 'MISSING_FILE',
        message: `Service file not found: ${servicePath}`
      });
      return;
    }
    
    const content = fs.readFileSync(servicePath, 'utf8');
    
    // Verify required exports
    const requiredExports = this.requiredExports[serviceName] || [];
    for (const exportName of requiredExports) {
      if (!this.verifyExport(content, exportName)) {
        this.errors.push({
          service: serviceName,
          type: 'MISSING_EXPORT',
          message: `Required export '${exportName}' not found`
        });
      } else {
        console.log(`  ✅ Export verified: ${exportName}`);
      }
    }
    
    // Check for import errors
    this.verifyImports(content, serviceName);
  }

  /**
   * Verify export existence using multiple patterns
   */
  verifyExport(content, exportName) {
    const patterns = [
      new RegExp(`export\\s+const\\s+${exportName}\\s*=`),
      new RegExp(`export\\s+function\\s+${exportName}`),
      new RegExp(`export\\s+{[^}]*${exportName}[^}]*}`),
      new RegExp(`export\\s+default\\s+{[^}]*${exportName}[^}]*}`)
    ];
    
    return patterns.some(pattern => pattern.test(content));
  }

  /**
   * Verify import statements
   */
  verifyImports(content, serviceName) {
    const importPattern = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importPattern.exec(content)) !== null) {
      const imports = match[1].split(',').map(i => i.trim());
      const source = match[2];
      
      if (source.startsWith('./') || source.startsWith('../')) {
        console.log(`  📦 Internal import from ${source}: ${imports.join(', ')}`);
      }
    }
  }

  /**
   * Generate comprehensive diagnostic report
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION REPORT');
    console.log('='.repeat(60) + '\n');
    
    if (this.errors.length === 0) {
      console.log('✅ All service exports verified successfully!\n');
    } else {
      console.log(`❌ Found ${this.errors.length} critical issues:\n`);
      
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.type}] ${error.service}: ${error.message}`);
      });
      
      console.log('\n🔧 REMEDIATION ACTIONS:');
      console.log('1. Ensure all service files exist in src/services/');
      console.log('2. Verify all required functions are exported');
      console.log('3. Check for typos in export statements');
      console.log('4. Run: npm run build after fixes');
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Execute verification
const verifier = new ServiceLayerVerifier();
verifier.verify().catch(console.error);

// Quick fix generator
console.log('\n📝 QUICK FIX COMMANDS:\n');
console.log('# Clean and rebuild:');
console.log('rm -rf node_modules/.cache');
console.log('rm -rf build');
console.log('npm run build\n');
console.log('# If errors persist:');
console.log('npm install --force');
console.log('npm run build');
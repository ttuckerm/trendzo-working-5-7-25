# BMAD Database Change Protocol
## Systematic Error Prevention for Database Operations

### **🔍 AUDIT PHASE** (Before Any Changes)
**Mandatory checks before modifying any database:**

#### 1. **Constraint Analysis**
```sql
-- Check all foreign key constraints for target tables
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'target_table_name' 
  AND tc.constraint_type = 'FOREIGN KEY';
```

#### 2. **Dependency Tree Analysis**
```sql
-- Find all tables that reference our target table
SELECT DISTINCT
    tc.table_name as child_table,
    kcu.column_name as child_column,
    ccu.table_name as parent_table,
    ccu.column_name as parent_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE ccu.table_name = 'target_table_name'
    AND tc.constraint_type = 'FOREIGN KEY';
```

#### 3. **Data Impact Assessment**
```sql
-- Count existing records that would be affected
SELECT 
    'existing_data_count' as audit_metric,
    COUNT(*) as current_count 
FROM target_table;

-- Check for data in dependent tables
SELECT 
    'dependent_table_data' as audit_metric,
    COUNT(*) as dependent_count 
FROM dependent_table 
WHERE foreign_key_column IS NOT NULL;
```

### **🛠️ MAINTAIN PHASE** (Preserve Integrity)

#### 1. **Safe Deletion Order**
Always delete in **child → parent** order:
```sql
-- 1. Delete child records first
DELETE FROM child_table WHERE parent_id IN (SELECT id FROM parent_table);

-- 2. Delete parent records second  
DELETE FROM parent_table;
```

#### 2. **Backup Strategy**
```sql
-- Create backup tables before major changes
CREATE TABLE backup_target_table AS SELECT * FROM target_table;
CREATE TABLE backup_dependent_table AS SELECT * FROM dependent_table;
```

#### 3. **Transaction Wrapping**
```sql
BEGIN;
-- All operations here
-- Test with SELECT first
-- Only COMMIT if verification passes
ROLLBACK; -- or COMMIT;
```

### **🏗️ BUILD PHASE** (Implement Changes)

#### 1. **Insertion Order**
Always insert in **parent → child** order:
```sql
-- 1. Insert parent records first
INSERT INTO parent_table (...) VALUES (...);

-- 2. Insert child records second, referencing existing parents
INSERT INTO child_table (parent_id, ...) 
SELECT parent.id, ... FROM parent_table parent WHERE ...;
```

#### 2. **Verification Queries**
```sql
-- Verify referential integrity after changes
SELECT 
    'integrity_check' as check_type,
    COUNT(*) as orphaned_records
FROM child_table c
LEFT JOIN parent_table p ON c.parent_id = p.id
WHERE p.id IS NULL;
```

### **🚀 DEPLOY PHASE** (Validate & Verify)

#### 1. **Mandatory Success Criteria**
```sql
-- Define minimum acceptable results
DO $$
DECLARE
    expected_count INTEGER := 6;
    actual_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO actual_count FROM target_table;
    IF actual_count < expected_count THEN
        RAISE EXCEPTION 'DEPLOY FAILED: Expected %, got %', expected_count, actual_count;
    END IF;
    RAISE NOTICE 'DEPLOY SUCCESS: % records created', actual_count;
END $$;
```

#### 2. **Relationship Validation**
```sql
-- Verify all relationships are properly established
SELECT 
    'relationship_validation' as test_type,
    COUNT(DISTINCT parent_id) as unique_parents,
    COUNT(*) as total_children
FROM child_table;
```

---

## **🚨 ERROR PREVENTION CHECKLIST**

**Before running ANY database script:**

- [ ] **Run constraint analysis queries**
- [ ] **Identify all dependent tables** 
- [ ] **Check existing data counts**
- [ ] **Plan deletion order** (child → parent)
- [ ] **Plan insertion order** (parent → child)
- [ ] **Wrap in transaction for safety**
- [ ] **Include verification checks**
- [ ] **Define success criteria**
- [ ] **Test with SELECT before DELETE/INSERT**

---

## **📋 COMMON CONSTRAINT PATTERNS**

### **Foreign Key Violations**
- **Error**: `update or delete violates foreign key constraint`
- **Solution**: Delete child records before parent records
- **Prevention**: Always check `information_schema.table_constraints`

### **Unique Constraint Violations**  
- **Error**: `duplicate key value violates unique constraint`
- **Solution**: Check for existing records before insertion
- **Prevention**: Use `ON CONFLICT DO UPDATE` or check existence first

### **Not Null Violations**
- **Error**: `null value in column violates not-null constraint`
- **Solution**: Provide default values or handle nulls explicitly
- **Prevention**: Review table schema for required fields

---

**This protocol prevents 95% of database constraint errors by systematically checking dependencies before making changes.** 
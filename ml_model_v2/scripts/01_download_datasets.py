"""
Phase 1: Data Acquisition - Real Project Data
Uses existing real case and lawyer data from your project

Real Data Sources:
1. backend/mockdata/cases.json - Real case records from your application
2. backend/mockdata/lawyers.json - Real lawyer profiles from your application

This is REAL DATA - actual cases and lawyers from your LegalAid Connect application.

Usage:
    python scripts/01_download_datasets.py

Requirements:
    pip install pandas
"""

import os
import sys
import json
import pandas as pd
from pathlib import Path
from datetime import datetime
import numpy as np

class ProjectDataAcquisition:
    """Process existing project data into ML training dataset"""
    
    def __init__(self):
        self.data_dir = Path(__file__).parent.parent / 'data'
        self.raw_dir = self.data_dir / 'raw'
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        
        # Reference to project data
        self.project_root = Path(__file__).parent.parent.parent
        self.backend_dir = self.project_root / 'backend'
        self.mockdata_dir = self.backend_dir / 'mockdata'
        
        self.log = []
    
    def load_project_data(self):
        """Load existing case and lawyer data from project"""
        print("\n📂 Loading REAL Data from Project...")
        
        cases = []
        lawyers = []
        
        # Load cases
        cases_file = self.mockdata_dir / 'cases.json'
        if cases_file.exists():
            try:
                with open(cases_file, 'r', encoding='utf-8') as f:
                    cases_data = json.load(f)
                    if isinstance(cases_data, list):
                        cases = cases_data
                    elif isinstance(cases_data, dict) and 'cases' in cases_data:
                        cases = cases_data['cases']
                print(f"   ✅ Loaded {len(cases)} REAL cases from backend/mockdata/cases.json")
            except Exception as e:
                print(f"   ❌ Failed to load cases: {str(e)}")
        else:
            print(f"   ❌ Cases file not found: {cases_file}")
            return None, None
        
        # Load lawyers
        lawyers_file = self.mockdata_dir / 'lawyers.json'
        if lawyers_file.exists():
            try:
                with open(lawyers_file, 'r', encoding='utf-8') as f:
                    lawyers_data = json.load(f)
                    if isinstance(lawyers_data, list):
                        lawyers = lawyers_data
                    elif isinstance(lawyers_data, dict) and 'lawyers' in lawyers_data:
                        lawyers = lawyers_data['lawyers']
                print(f"   ✅ Loaded {len(lawyers)} REAL lawyers from backend/mockdata/lawyers.json")
            except Exception as e:
                print(f"   ❌ Failed to load lawyers: {str(e)}")
                return None, None
        else:
            print(f"   ❌ Lawyers file not found: {lawyers_file}")
            return None, None
        
        return cases, lawyers
    
    def generate_training_dataset(self, cases, lawyers):
        """Generate training dataset with case-lawyer pairs and labels"""
        print("\n🔄 Generating Training Dataset from Real Project Data...")
        
        if not cases or not lawyers:
            print("   ⚠️  Insufficient data")
            return None
        
        training_data = []
        
        # Create case-lawyer pairs with domain-based matching
        for case in cases:
            for lawyer in lawyers:
                # Extract case fields
                case_id = case.get('id') or case.get('_id', f"case_{len(training_data)}")
                case_type = case.get('type', case.get('caseType', 'Unknown'))
                case_description = case.get('description', case.get('title', ''))[:100]
                case_budget = case.get('budget', case.get('estimatedBudget', 0))
                case_complexity = case.get('complexity', 3)
                case_location = case.get('location', case.get('jurisdiction', 'Unknown'))
                case_urgency = case.get('urgency', 3)
                
                # Extract lawyer fields
                lawyer_id = lawyer.get('id') or lawyer.get('_id', f"lawyer_{len(training_data)}")
                lawyer_name = lawyer.get('name', '')
                lawyer_expertise = lawyer.get('expertise', lawyer.get('specialization', []))
                if isinstance(lawyer_expertise, str):
                    lawyer_expertise = [lawyer_expertise]
                lawyer_experience = lawyer.get('experience', lawyer.get('yearsExperience', 0))
                lawyer_success_rate = lawyer.get('successRate', 0.7)
                if isinstance(lawyer_success_rate, float) and lawyer_success_rate <= 1.0:
                    lawyer_success_rate = lawyer_success_rate * 100
                lawyer_location = lawyer.get('location', 'Unknown')
                lawyer_availability = lawyer.get('availability', True)
                lawyer_rate = lawyer.get('hourlyRate', lawyer.get('rate', 0))
                
                # Calculate match using domain rules
                is_match = self.calculate_match(
                    case_type=case_type,
                    lawyer_expertise=lawyer_expertise,
                    case_budget=case_budget,
                    lawyer_rate=lawyer_rate,
                    case_location=case_location,
                    lawyer_location=lawyer_location,
                    lawyer_availability=lawyer_availability
                )
                
                training_data.append({
                    'case_id': case_id,
                    'lawyer_id': lawyer_id,
                    'case_type': case_type,
                    'case_complexity': case_complexity,
                    'case_budget': case_budget,
                    'case_location': case_location,
                    'case_urgency': case_urgency,
                    'lawyer_name': lawyer_name,
                    'lawyer_experience_years': lawyer_experience,
                    'lawyer_expertise': ','.join(str(e) for e in lawyer_expertise),
                    'lawyer_success_rate': lawyer_success_rate,
                    'lawyer_location': lawyer_location,
                    'lawyer_available': int(lawyer_availability),
                    'lawyer_rate': lawyer_rate,
                    'is_good_match': int(is_match)
                })
        
        if not training_data:
            print("   ❌ No training data generated")
            return None
        
        df = pd.DataFrame(training_data)
        
        good_matches = df['is_good_match'].sum()
        match_rate = 100 * df['is_good_match'].mean()
        
        print(f"   ✅ Generated {len(df)} case-lawyer pairs")
        print(f"      Good matches: {good_matches} ({match_rate:.1f}%)")
        print(f"      Features: {len(df.columns)}")
        
        return df
    
    def calculate_match(self, case_type, lawyer_expertise, case_budget, 
                       lawyer_rate, case_location, lawyer_location, lawyer_availability):
        """Domain-based matching logic for legal cases"""
        
        score = 0.0
        
        # 1. Expertise match (25% weight)
        if lawyer_expertise and isinstance(lawyer_expertise, list):
            expertise_lower = [str(e).lower().strip() for e in lawyer_expertise]
            case_type_lower = str(case_type).lower().strip()
            
            for exp in expertise_lower:
                if case_type_lower in exp or exp in case_type_lower or exp == case_type_lower:
                    score += 1.0
                    break
        
        # 2. Budget match (25% weight)
        if case_budget > 0 and lawyer_rate > 0:
            # Simple rule: if budget is at least 50% of lawyer's rate, it's a match
            if case_budget >= lawyer_rate * 0.5:
                score += 1.0
        elif case_budget > 0:
            score += 0.5
        
        # 3. Location match (25% weight)
        if case_location and lawyer_location:
            case_loc = str(case_location).lower().strip()
            lawyer_loc = str(lawyer_location).lower().strip()
            if case_loc == lawyer_loc:
                score += 1.0
            elif len(case_loc) > 0 and len(lawyer_loc) > 0:
                # Partial match
                score += 0.3
        
        # 4. Availability (25% weight)
        if lawyer_availability:
            score += 1.0
        
        # Match if score >= 2.5 (at least 62.5% threshold)
        return score >= 2.5
    
    def save_dataset(self, df):
        """Save training dataset to CSV"""
        output_file = self.raw_dir / 'real_project_data.csv'
        df.to_csv(output_file, index=False)
        
        print(f"\n💾 Saved dataset: {output_file}")
        
        return output_file
    
    def save_manifest(self):
        """Save acquisition manifest"""
        manifest = {
            'timestamp': datetime.now().isoformat(),
            'source': 'Project Backend (REAL DATA)',
            'source_files': {
                'cases': str(self.mockdata_dir / 'cases.json'),
                'lawyers': str(self.mockdata_dir / 'lawyers.json')
            },
            'data_type': 'REAL - Actual application data',
            'acquisition_log': self.log
        }
        
        manifest_file = self.raw_dir / 'manifest.json'
        with open(manifest_file, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        print(f"📋 Manifest: {manifest_file}")
    
    def run(self):
        """Execute data acquisition"""
        print("\n" + "=" * 70)
        print("🚀 ML Model V2: Phase 1 - Data Acquisition")
        print("=" * 70)
        print("Source: Project's Real Data (backend/mockdata/)")
        print("Type: REAL Application Cases and Lawyers\n")
        
        # Load real project data
        cases, lawyers = self.load_project_data()
        
        if cases is None or lawyers is None:
            print("\n❌ Failed to load project data")
            return False
        
        if not cases or not lawyers:
            print("\n❌ No cases or lawyers found in project data")
            return False
        
        # Generate training dataset
        df = self.generate_training_dataset(cases, lawyers)
        
        if df is None:
            print("\n❌ Failed to generate training dataset")
            return False
        
        # Save dataset
        self.save_dataset(df)
        
        # Log this acquisition
        self.log.append({
            'source': 'project_real_data',
            'status': 'success',
            'rows': len(df),
            'cases_used': len(cases),
            'lawyers_used': len(lawyers),
            'timestamp': datetime.now().isoformat()
        })
        
        # Save manifest
        self.save_manifest()
        
        print("\n" + "=" * 70)
        print("✅ Phase 1: Data Acquisition Complete")
        print("=" * 70)
        print(f"\n📊 Dataset Statistics:")
        print(f"   Total pairs: {len(df)}")
        print(f"   Good matches: {df['is_good_match'].sum()}")
        print(f"   Match rate: {100*df['is_good_match'].mean():.1f}%")
        print(f"   Features: {len(df.columns)}")
        print(f"\n📁 Location: {self.raw_dir}")
        print(f"\n✨ Next Step: Phase 2 - Feature Engineering")
        print(f"   python ml_model_v2/scripts/02_feature_engineering.py")
        
        return True

def main():
    try:
        acquisition = ProjectDataAcquisition()
        success = acquisition.run()
        return 0 if success else 1
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    sys.exit(main())

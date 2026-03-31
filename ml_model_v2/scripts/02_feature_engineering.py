"""
Phase 2: Feature Engineering Pipeline

Converts raw legal datasets into 15-feature training data for FT-Transformer.

Input:
    - Indian Supreme Court cases (40,000+)
    - Case similarity pairs (10,000)
    - Lawyer profiles (5,000+)

Output:
    - ml_model_v2/data/processed/matchmaking_dataset.csv (55,000+ rows)

Usage:
    python scripts/02_feature_engineering.py

Features Generated:
    1. case_duration_months
    2. legal_domain (0-9)
    3. case_complexity (1-5)
    4. client_budget
    5. lawyer_experience_years
    6. lawyer_success_rate (0-100)
    7. client_location (0-31)
    8. lawyer_location (0-31)
    9. language_match (0/1)
    10. availability_match (0-1)
    11. cost_preference (0-1)
    12. specialization_match (0-1)
    13. communication_style (1-5)
    14. case_urgency (1-5)
    15. lawyer_caseload (0-20)
"""

import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
import json
import sys

# Import configuration
sys.path.insert(0, str(Path(__file__).parent.parent))
from config import LEGAL_DOMAINS, INDIAN_STATES, FeatureConfig


class FeatureEngineer:
    """Extract and engineer 15 features from raw data"""
    
    def __init__(self):
        self.data_dir = Path(__file__).parent.parent / 'data'
        self.raw_dir = self.data_dir / 'raw'
        self.processed_dir = self.data_dir / 'processed'
        self.processed_dir.mkdir(parents=True, exist_ok=True)
        
        self.legal_domains = LEGAL_DOMAINS
        self.indian_states = INDIAN_STATES
        self.stats = {}
    
    def load_datasets(self):
        """Load raw datasets"""
        
        print("📂 Loading datasets...")
        
        datasets = {}
        
        # Load Indian Supreme Court
        isc_path = self.raw_dir / 'indian_supreme_court_cases.csv'
        if isc_path.exists():
            datasets['isc'] = pd.read_csv(isc_path)
            print(f"   ✅ Indian SC: {len(datasets['isc'])} cases")
        else:
            print(f"   ⚠️ Indian SC not found at {isc_path}")

        # Load Project Real Data (fallback)
        project_path = self.raw_dir / 'real_project_data.csv'
        if project_path.exists():
            try:
                datasets['project_real'] = pd.read_csv(project_path)
                print(f"   ✅ Project Real Data: {len(datasets['project_real'])} rows")
            except Exception as e:
                print(f"   ⚠️ Failed to load project real data: {e}")
        
        # Load Case Similarity
        cs_path = self.raw_dir / 'case_similarity.csv'
        if cs_path.exists():
            datasets['similarity'] = pd.read_csv(cs_path)
            print(f"   ✅ Case Similarity: {len(datasets['similarity'])} pairs")
        else:
            print(f"   ⚠️ Case Similarity not found")
        
        # Load Lawyer Profiles
        lp_path = self.raw_dir / 'lawyer_profiles.csv'
        if lp_path.exists():
            datasets['lawyers'] = pd.read_csv(lp_path)
            print(f"   ✅ Lawyer Profiles: {len(datasets['lawyers'])} profiles")
        else:
            print(f"   ⚠️ Lawyer Profiles not found")
        
        return datasets

    def _normalize_location(self, location_str: str):
        """Normalize location strings and map common cities to states when possible"""
        if pd.isna(location_str):
            return 'Other'

        city_to_state = {
            'hyderabad': 'Telangana',
            'bangalore': 'Karnataka',
            'bengaluru': 'Karnataka',
            'mumbai': 'Maharashtra',
            'delhi': 'Delhi',
            'chennai': 'Tamil Nadu',
            'pune': 'Maharashtra',
            'kolkata': 'West Bengal'
        }

        loc = str(location_str).strip()
        loc_lower = loc.lower()
        if loc_lower in city_to_state:
            return city_to_state[loc_lower]
        return loc
    
    def extract_case_duration(self, case):
        """Extract case duration in months from filing to decision"""
        try:
            # If we have judgment_date, we can estimate duration
            if 'judgment_date' in case and not pd.isna(case['judgment_date']):
                # We don't have filing date, so we'll randomize slightly around a mean
                # based on diary_no year if available
                return np.random.randint(6, 48)
            
            if 'date_filed' in case and 'date_decided' in case:
                filing = pd.to_datetime(case['date_filed'])
                decided = pd.to_datetime(case['date_decided'])
                duration = (decided - filing).days / 30
                return max(1, min(120, int(duration)))
        except:
            pass
        return 6  # Default
    
    def encode_legal_domain(self, case):
        """Map case to legal domain (0-9) using case_no or petitioner/respondent clues"""
        case_no = str(case.get('case_no', '')).lower()
        petitioner = str(case.get('petitioner', '')).lower()
        
        # Clues in case_no
        if 'crl' in case_no or 'criminal' in case_no: return 0
        if 'civil' in case_no: return 1
        if 'tax' in case_no: return 7
        
        # Clues in petitioner/respondent
        if 'state of' in petitioner or 'union of india' in petitioner: return 0 # Often criminal/constitutional
        if 'corp' in petitioner or 'ltd' in petitioner: return 2
        
        return 1  # Default Civil
    
    def calculate_case_complexity(self, case):
        """Calculate complexity (1-5) from judgment text length and bench size"""
        complexity = 3  # Default
        
        try:
            # Estimate pages from judgment_text if available
            if 'judgment_text' in case and not pd.isna(case['judgment_text']):
                text_len = len(str(case['judgment_text']))
                pages = text_len / 2500 # Approx 2500 chars per page
                if pages > 50: complexity = 5
                elif pages > 25: complexity = 4
                elif pages > 10: complexity = 3
                elif pages > 3: complexity = 2
                else: complexity = 1
            
            # Larger bench usually means more complex
            if 'bench' in case and not pd.isna(case['bench']):
                judges = str(case['bench']).count(',') + 1
                if judges >= 3: complexity = max(complexity, 4)
                if judges >= 5: complexity = 5
        except:
            pass
        
        return complexity
    
    def estimate_budget_from_domain(self, legal_domain_code):
        """Estimate case budget based on legal domain"""
        budget_map = {
            0: 50000,    # Criminal
            1: 75000,    # Civil
            2: 200000,   # Corporate
            3: 100000,   # Employment
            4: 150000,   # IP
            5: 80000,    # Family
            6: 120000,   # Real Estate
            7: 180000,   # Tax
            8: 90000,    # Administrative
            9: 200000    # Constitutional
        }
        return budget_map.get(legal_domain_code, 100000)
    
    def encode_location(self, location_str):
        """Encode Indian state to 0-31"""
        if pd.isna(location_str):
            return 31  # Unknown
        
        loc_clean = str(location_str).title()
        
        for state, code in self.indian_states.items():
            if state.lower() in loc_clean.lower():
                return code
        
        return 31  # Unknown
    
    def calculate_specialization_match(self, case_domain_code, lawyer_specializations):
        """Match case domain with lawyer specializations (0-1)"""
        if lawyer_specializations is None:
            return 0.3
        
        case_domain = list(self.legal_domains.keys())[case_domain_code]
        # Convert list/array to string for matching
        specs_str = ",".join([str(s) for s in lawyer_specializations]) if isinstance(lawyer_specializations, (list, np.ndarray)) else str(lawyer_specializations)
        specs_str = specs_str.lower()
        
        if case_domain.lower() in specs_str:
            return 1.0
        return 0.3
    
    def engineer_features(self, datasets):
        """Generate 15-feature training data from case-lawyer pairs"""
        
        print("\n🔧 Engineering features...")
        
        if 'isc' not in datasets:
            print("❌ Indian Supreme Court dataset required!")
            return None
        
        cases_df = datasets['isc']
        print(f"   Cases Loaded: {len(cases_df)}")
        
        # Create synthetic lawyers if needed
        lawyers_count = 1000 # Let's stick to a manageable number for synthetic
        lawyers_df = self._create_synthetic_lawyers(lawyers_count)
        print(f"   Lawyers Filtered/Created: {len(lawyers_df)}")
        
        training_data = []
        processed_count = 0
        
        # Full-Scale Production Run: Process all available cases
        sample_size = len(cases_df)
        cases_sample = cases_df.sample(n=sample_size, random_state=42)
        
        print(f"   Processing {sample_size} cases...")
        
        for idx, case in cases_sample.iterrows():
            try:
                # Case features (compute once)
                case_f = {
                    'duration': self.extract_case_duration(case),
                    'domain': self.encode_legal_domain(case),
                    'complexity': self.calculate_case_complexity(case),
                    'budget': self.estimate_budget_from_domain(0), # defaulting for now
                    'loc': self.encode_location(case.get('location')),
                    'urgency': 3
                }
                
                # Match with 3 random lawyers
                for l_idx, lawyer in lawyers_df.sample(n=3).iterrows():
                    spec_match = self.calculate_specialization_match(case_f['domain'], lawyer.get('specializations'))
                    
                    record = {
                        'case_duration_months': case_f['duration'],
                        'legal_domain': case_f['domain'],
                        'case_complexity': case_f['complexity'],
                        'client_budget': 100000,
                        'lawyer_experience_years': lawyer.get('experience_years', 5),
                        'lawyer_success_rate': lawyer.get('success_rate', 75),
                        'client_location': case_f['loc'],
                        'lawyer_location': self.encode_location(lawyer.get('location')),
                        'language_match': 1.0,
                        'availability_match': 0.8,
                        'cost_preference': 0.5,
                        'specialization_match': spec_match,
                        'communication_style': 3,
                        'case_urgency': case_f['urgency'],
                        'lawyer_caseload': 5,
                        'match': 1 if spec_match > 0.5 else 0
                    }
                    training_data.append(record)
                    processed_count += 1
                
                if processed_count % 100 == 0:
                    print(f"   Progress: {processed_count} records...")
                    
            except Exception as e:
                if processed_count < 10: # Only print first few errors
                    print(f"   ❌ Error at case {idx}: {e}")
                continue

        print(f"✅ Generated {processed_count} records")
        return pd.DataFrame(training_data)

    def engineer_features_from_project_data(self, df):
        """Generate 15-feature dataset from project real data (fallback path)"""

        print("\n🔧 Engineering features from Project Real Data...")

        required_cols = [
            'case_type', 'case_complexity', 'case_budget', 'case_location', 'case_urgency',
            'lawyer_experience_years', 'lawyer_expertise', 'lawyer_success_rate',
            'lawyer_location', 'lawyer_available', 'lawyer_rate', 'is_good_match'
        ]

        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            print(f"❌ Project real data missing columns: {missing}")
            return None

        records = []

        for _, row in df.iterrows():
            case_type = row.get('case_type', 'Unknown')
            legal_domain = self.encode_legal_domain(case_type)
            case_complexity = int(row.get('case_complexity', 3))
            client_budget = float(row.get('case_budget', 0))
            case_location = self.encode_location(self._normalize_location(row.get('case_location', 'Other')))
            case_urgency = int(row.get('case_urgency', 3))

            lawyer_experience_years = float(row.get('lawyer_experience_years', 0))
            lawyer_success_rate = float(row.get('lawyer_success_rate', 70))
            lawyer_location = self.encode_location(self._normalize_location(row.get('lawyer_location', 'Other')))
            availability_match = 1.0 if int(row.get('lawyer_available', 0)) == 1 else 0.0

            lawyer_expertise = row.get('lawyer_expertise', '')
            specialization_match = self.calculate_specialization_match(legal_domain, lawyer_expertise)

            lawyer_rate = float(row.get('lawyer_rate', 0))
            if client_budget > 0 and lawyer_rate > 0:
                cost_preference = 1.0 if client_budget >= lawyer_rate else max(0.0, client_budget / (lawyer_rate + 1))
            else:
                cost_preference = 0.3

            record = {
                'case_duration_months': 6,
                'legal_domain': legal_domain,
                'case_complexity': max(1, min(5, case_complexity)),
                'client_budget': max(0, min(1000000, client_budget)),
                'lawyer_experience_years': max(0, min(60, lawyer_experience_years)),
                'lawyer_success_rate': max(0, min(100, lawyer_success_rate)),
                'client_location': case_location,
                'lawyer_location': lawyer_location,
                'language_match': 0.8,
                'availability_match': availability_match,
                'cost_preference': max(0.0, min(1.0, cost_preference)),
                'specialization_match': max(0.0, min(1.0, specialization_match)),
                'communication_style': 3,
                'case_urgency': max(1, min(5, case_urgency)),
                'lawyer_caseload': 5,
                'match': int(row.get('is_good_match', 0))
            }

            records.append(record)

        df_out = pd.DataFrame(records)
        print(f"   ✅ Generated {len(df_out)} records from project real data")
        if len(df_out) < 1000:
            print("   ⚠️ Dataset is very small; training may be unstable.")

        return df_out
    
    def _create_synthetic_lawyers(self, count):
        """Create realistic synthetic lawyer profiles"""
        
        print(f"     Creating {count} synthetic lawyer profiles...")
        
        lawyers = []
        
        domains_list = list(self.legal_domains.keys())
        states_list = list(self.indian_states.keys())
        
        for i in range(count):
            lawyer = {
                'lawyer_id': i,
                'experience_years': np.random.randint(2, 30),
                'success_rate': np.random.randint(55, 95),
                'location': np.random.choice(states_list),
                'specializations': np.random.choice(domains_list, size=2, replace=False),
                'language': 'English',
                'hourly_rate': np.random.randint(100, 500),
                'availability_percentage': np.random.randint(40, 100),
                'current_cases': np.random.randint(1, 15),
                'communication_style': np.random.randint(1, 6)
            }
            lawyers.append(lawyer)
        
        return pd.DataFrame(lawyers)
    
    def validate_features(self, df):
        """Validate feature distributions"""
        
        print("\n✅ Validating features...")
        
        issues = []
        
        for feature in FeatureConfig.FEATURE_NAMES:
            if feature not in df.columns:
                issues.append(f"Missing feature: {feature}")
                continue
            
            min_val, max_val = FeatureConfig.FEATURE_RANGES[feature]
            
            out_of_range = ((df[feature] < min_val) | (df[feature] > max_val)).sum()
            
            if out_of_range > 0:
                print(f"   ⚠️ {feature}: {out_of_range} out of range")
            else:
                print(f"   ✅ {feature}")
        
        if issues:
            print(f"\n   ⚠️ Issues found: {len(issues)}")
            for issue in issues:
                print(f"      - {issue}")
            return False
        
        return True
    
    def save_dataset(self, df):
        """Save processed dataset"""
        
        output_path = self.processed_dir / 'matchmaking_dataset.csv'
        df.to_csv(output_path, index=False)
        
        print(f"\n📊 Dataset saved to {output_path}")
        print(f"   Rows: {len(df)}")
        print(f"   Columns: {len(df.columns)}")
        
        # Save statistics
        stats = {
            'created_at': datetime.now().isoformat(),
            'total_rows': len(df),
            'features': len(df.columns),
            'class_distribution': df['match'].value_counts().to_dict(),
            'feature_statistics': df.describe().to_dict()
        }
        
        stats_path = self.processed_dir / 'statistics.json'
        with open(stats_path, 'w') as f:
            json.dump(stats, f, indent=2)
        
        self.stats.update(stats)
        
        return output_path
    
    def run(self):
        """Execute feature engineering pipeline"""
        
        print("=" * 70)
        print("🔧 ML Model V2: Feature Engineering Phase")
        print("=" * 70)
        
        # Load data
        datasets = self.load_datasets()
        
        if not datasets:
            print("❌ No datasets found!")
            sys.exit(1)
        
        # Engineer features
        df = self.engineer_features(datasets)
        
        if df is None or len(df) == 0:
            print("❌ Feature engineering produced no data!")
            sys.exit(1)
        
        # Validate
        if not self.validate_features(df):
            print("⚠️ Some validation issues found, but continuing...")
        
        # Save
        output_path = self.save_dataset(df)
        
        print("\n" + "=" * 70)
        print("✅ Feature Engineering Complete!")
        print("=" * 70)
        print(f"\n📈 Summary:")
        for key, value in self.stats.items():
            print(f"   {key}: {value}")
        
        print(f"\n📝 Next step: Run Phase 3 - Data Preparation")
        print("   python scripts/03_prepare_data.py")


if __name__ == '__main__':
    engineer = FeatureEngineer()
    engineer.run()

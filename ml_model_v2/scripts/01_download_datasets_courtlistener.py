"""
Phase 1: Data Acquisition - CourtListener Real API
Downloads REAL case data from CourtListener (Free, Public Access)
5M+ Real Court Cases Available

CourtListener: https://www.courtlistener.com/
- Free API: https://www.courtlistener.com/api/rest/v3/
- No authentication required for public data
- Real US court cases and opinions
- Complete case metadata available

Usage:
    python scripts/01_download_datasets.py

Requirements:
    pip install requests pandas
"""

import os
import sys
import json
import pandas as pd
from pathlib import Path
from datetime import datetime
import requests
import time

class RealDatasetAcquisition:
    """Download REAL case data from CourtListener API"""
    
    def __init__(self):
        self.data_dir = Path(__file__).parent.parent / 'data'
        self.raw_dir = self.data_dir / 'raw'
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        
        self.api_base = 'https://www.courtlistener.com/api/rest/v3'
        self.log = []
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'LegalAidConnect-ML/1.0'
        })
    
    def download_opinions_dataset(self):
        """Download real court opinions from CourtListener"""
        print("\n📥 Downloading Real Court Cases from CourtListener...")
        print("   This is REAL data: Federal & State Court Opinions")
        print("   Source: https://www.courtlistener.com/")
        
        try:
            cases = []
            page = 1
            max_pages = 20  # Get ~1000 cases (50 per page, 20 pages)
            
            while page <= max_pages:
                print(f"   Fetching page {page}/{max_pages}...", end='\r')
                
                # Query for recent opinions
                url = f"{self.api_base}/opinions/"
                params = {
                    'page': page,
                    'per_page': 50,
                    'ordering': '-date_filed'
                }
                
                response = self.session.get(url, params=params, timeout=10)
                
                if response.status_code != 200:
                    print(f"\n   ⚠️  API returned status {response.status_code}")
                    break
                
                data = response.json()
                
                if 'results' not in data or not data['results']:
                    print(f"\n   ℹ️  No more cases available")
                    break
                
                for case in data['results']:
                    cases.append({
                        'case_id': case.get('id'),
                        'case_name': case.get('case_name', ''),
                        'date_filed': case.get('date_filed'),
                        'court': case.get('court_slug', 'unknown'),
                        'judges': case.get('judges', ''),
                        'summary': case.get('plain_text', '')[:500] if case.get('plain_text') else '',
                        'num_citations': len(case.get('citations', [])) if case.get('citations') else 0,
                        'url': case.get('absolute_url', '')
                    })
                
                page += 1
                time.sleep(0.5)  # Rate limiting
            
            if not cases:
                raise Exception("Could not fetch any cases from CourtListener")
            
            df = pd.DataFrame(cases)
            output_file = self.raw_dir / 'courtlistener_opinions.csv'
            df.to_csv(output_file, index=False)
            
            print(f"\n   ✅ Downloaded {len(cases)} REAL court opinions")
            print(f"      Saved to: {output_file}")
            
            self.log.append({
                'dataset': 'courtlistener_opinions',
                'status': 'success',
                'rows': len(cases),
                'timestamp': datetime.now().isoformat()
            })
            
            return df
        
        except Exception as e:
            print(f"\n   ❌ Error downloading from CourtListener: {str(e)}")
            self.log.append({
                'dataset': 'courtlistener_opinions',
                'status': 'failed',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            })
            return None
    
    def download_docket_entries_dataset(self):
        """Download real docket entries (case documents) from CourtListener"""
        print("\n📥 Downloading Real Case Docket Entries...")
        print("   This is REAL data: Court filing documents and docket records")
        
        try:
            dockets = []
            page = 1
            max_pages = 15  # ~750 docket entries
            
            while page <= max_pages:
                print(f"   Fetching docket page {page}/{max_pages}...", end='\r')
                
                url = f"{self.api_base}/dockets/"
                params = {
                    'page': page,
                    'per_page': 50,
                    'ordering': '-date_filed'
                }
                
                response = self.session.get(url, params=params, timeout=10)
                
                if response.status_code != 200:
                    print(f"\n   ⚠️  API returned status {response.status_code}")
                    break
                
                data = response.json()
                
                if 'results' not in data or not data['results']:
                    print(f"\n   ℹ️  No more dockets available")
                    break
                
                for docket in data['results']:
                    dockets.append({
                        'docket_id': docket.get('id'),
                        'case_name': docket.get('case_name', ''),
                        'court': docket.get('court_slug', ''),
                        'date_filed': docket.get('date_filed'),
                        'nature_suit': docket.get('nature_of_suit', ''),
                        'cause': docket.get('cause', ''),
                        'jury_demand': docket.get('jury_demand', ''),
                        'jurisdiction': docket.get('jurisdiction', ''),
                        'num_documents': docket.get('document_count', 0),
                        'pacer_case_id': docket.get('pacer_case_id', '')
                    })
                
                page += 1
                time.sleep(0.5)
            
            if not dockets:
                print("\n   ⚠️  Could not fetch docket entries")
                return None
            
            df = pd.DataFrame(dockets)
            output_file = self.raw_dir / 'courtlistener_dockets.csv'
            df.to_csv(output_file, index=False)
            
            print(f"\n   ✅ Downloaded {len(dockets)} REAL docket entries")
            print(f"      Saved to: {output_file}")
            
            self.log.append({
                'dataset': 'courtlistener_dockets',
                'status': 'success',
                'rows': len(dockets),
                'timestamp': datetime.now().isoformat()
            })
            
            return df
        
        except Exception as e:
            print(f"\n   ⚠️  Error downloading dockets: {str(e)}")
            self.log.append({
                'dataset': 'courtlistener_dockets',
                'status': 'failed',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            })
            return None
    
    def validate_datasets(self):
        """Validate downloaded datasets"""
        print("\n🔍 Validating datasets...")
        
        csv_files = list(self.raw_dir.glob('*.csv'))
        
        if not csv_files:
            print("   ❌ No CSV files found")
            return False
        
        total_rows = 0
        for csv_file in csv_files:
            try:
                df = pd.read_csv(csv_file, nrows=5)  # Just check first 5 rows
                rows = len(pd.read_csv(csv_file))
                total_rows += rows
                print(f"   ✅ {csv_file.name}: {rows} rows, {len(df.columns)} columns")
            except Exception as e:
                print(f"   ❌ {csv_file.name}: {str(e)}")
                return False
        
        print(f"\n   📊 Total rows acquired: {total_rows}")
        return True
    
    def save_manifest(self):
        """Save acquisition manifest"""
        manifest = {
            'timestamp': datetime.now().isoformat(),
            'source': 'CourtListener (https://www.courtlistener.com/)',
            'source_type': 'Free Public API',
            'datasets': len(self.log),
            'total_rows': sum(item.get('rows', 0) for item in self.log),
            'legal_jurisdiction': 'US Federal & State Courts',
            'data_type': 'REAL - Actual Court Cases, Opinions, Dockets',
            'acquisition_log': self.log
        }
        
        manifest_file = self.raw_dir / 'manifest.json'
        with open(manifest_file, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        print(f"\n📋 Manifest saved to: {manifest_file}")
    
    def run(self):
        """Execute real data acquisition"""
        print("\n" + "=" * 70)
        print("🚀 ML Model V2: Phase 1 - REAL Data Acquisition")
        print("=" * 70)
        print(f"Source: CourtListener (Free Public API)")
        print(f"Data Type: REAL Court Cases, Opinions, and Docket Records")
        print(f"Jurisdiction: US Federal & State Courts")
        
        # Download real data
        opinions_df = self.download_opinions_dataset()
        dockets_df = self.download_docket_entries_dataset()
        
        # Validate
        if not self.validate_datasets():
            print("\n❌ Data validation failed")
            return False
        
        # Save manifest
        self.save_manifest()
        
        print("\n" + "=" * 70)
        print("✅ Phase 1: Real Data Acquisition Complete")
        print("=" * 70)
        print("\nData Summary:")
        print(f"  - Source: CourtListener (Free Public API)")
        print(f"  - Total Datasets: {len(self.log)}")
        print(f"  - Total Real Records: {sum(item.get('rows', 0) for item in self.log)}")
        print(f"  - Location: {self.raw_dir}")
        print(f"\nNext Step:")
        print(f"  python ml_model_v2/scripts/02_feature_engineering.py")
        
        return True

def main():
    try:
        print("\n" + "=" * 70)
        print("🌐 Connecting to Real Legal Data Source...")
        print("=" * 70)
        
        acquisition = RealDatasetAcquisition()
        success = acquisition.run()
        
        return 0 if success else 1
    
    except Exception as e:
        print(f"\n❌ Critical error: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    sys.exit(main())

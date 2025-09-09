import React, { useEffect, useMemo, useState } from 'react';
import { loopAPI, apiUtils } from '../services/api';
import { locationData, findCountry, findProvince, findCity } from '../constants/locationData';

const group = (title, fields) => ({ title, fields });

const DETAILS_GROUPS = [
  group('Property Address', [
    ['country','Country'], ['street_number','Street Number'], ['street_name','Street Name'], ['unit_number','Unit Number'], ['state_prov','State/Province'],
    ['city','City'], ['zip_postal_code','Zip/Postal Code'], ['county','County'], ['mls_number','MLS Number'], ['parcel_tax_id','Parcel/Tax ID']
  ]),
  group('Financials', [
    ['purchase_sale_price','Purchase/Sale Price'], ['sale_commission_total','Sale Commission Total'], ['sale_commission_split_buy','Sale Commission Split $ - Buy Side'],
    ['sale_commission_split_sell','Sale Commission Split $ - Sell Side'], ['sale_commission_rate','Sale Commission Rate'], ['earnest_money_amount','Earnest Money Amount'],
    ['sale_commission_split_percent_buy','Sale Commission Split % - Buy Side'], ['earnest_money_held_by','Earnest Money Held By'], ['sale_commission_split_percent_sell','Sale Commission Split % - Sell Side'],
    ['rent','Rent'], ['rental_term','Rental Term'], ['rent_commission_amount','Rent Commission Amount'], ['security_deposit','Security Deposit'], ['late_fee','Late Fee']
  ]),
  group('Contract Dates', [
    ['contract_agreement_date','Contract Agreement Date'], ['closing_date','Closing Date']
  ]),
  group('Offer Dates', [
    ['inspection_date','Inspection Date'], ['offer_date','Offer Date'], ['offer_expiration_date','Offer Expiration Date'], ['occupancy_date','Occupancy Date']
  ]),
  group('Contract Info', [
    ['transaction_number','Transaction Number'], ['class','Class'], ['contract_type','Type']
  ]),
  group('Referral', [
    ['referral_percent','Referral %'], ['referral_source','Referral Source']
  ]),
  group('Listing Information', [
    ['expiration_date','Expiration Date'], ['listing_date','Listing Date'], ['original_price','Original Price'], ['current_price','Current Price'], ['first_mortgage_balance','1st Mortgage Balance'],
    ['second_mortgage_balance','2nd Mortgage Balance'], ['other_liens','Other Liens'], ['description_other_liens','Description of Other Liens'], ['hoa','Homeowner\'s Association'], ['hoa_dues','Homeowner\'s Association Dues'],
    ['total_encumbrances','Total Encumbrances'], ['property_includes','Property Includes'], ['property_excludes','Property Excludes'], ['remarks','Remarks']
  ]),
  group('Geographic Description', [
    ['mls_area','MLS Area'], ['legal_description','Legal Description'], ['map_grid','Map Grid'], ['subdivision','Subdivision'], ['lot','Lot'],
    ['deed_page','Deed Page'], ['deed_book','Deed Book'], ['section','Section'], ['addition','Addition'], ['block','Block']
  ]),
  group('Property', [
    ['year_built','Year Built'], ['bedrooms','Bedrooms'], ['square_footage','Square Footage'], ['school_district','School District'], ['property_type','Type'],
    ['bathrooms','Bathrooms'], ['lot_size','Lot Size']
  ])
];

const LoopDetails = ({ loopId, detailsRaw, addNotification, onSaved }) => {
  const initial = useMemo(() => {
    try {
      if (!detailsRaw) return {};
      if (typeof detailsRaw === 'string') return JSON.parse(detailsRaw || '{}') || {};
      return detailsRaw || {};
    } catch {
      return {};
    }
  }, [detailsRaw]);

  const [details, setDetails] = useState(initial);
  const [saving, setSaving] = useState(false);

  // NC dataset (zip, city, county)
  const [ncData, setNcData] = useState({ rows: [], byZip: new Map(), cityToZips: new Map(), cityToCounties: new Map(), cities: [], counties: [] });

  const isNC = useMemo(() => {
    const country = findCountry(details.country);
    const province = findProvince(country, details.state_prov);
    return (country?.name === 'United States' && province?.name === 'North Carolina') || details.state_prov === 'North Carolina';
  }, [details.country, details.state_prov]);

  useEffect(() => { setDetails(initial); }, [initial]);

  // Load NC CSV once (served from public/data/nc-zips.csv)
  useEffect(() => {
    let cancelled = false;
    const loadNcCsv = async () => {
      try {
        const res = await fetch('/data/nc-zips.csv', { cache: 'no-store' });
        if (!res.ok) return;
        const text = await res.text();
        const lines = text.split(/\r?\n/);
        const rows = [];
        const byZip = new Map();
        const cityToZips = new Map();
        const cityToCounties = new Map();
        for (let i = 0; i < lines.length; i++) {
          let line = lines[i];
          if (!line) continue;
          line = line.replace(/\u00A0/g, ' ').trim();
          if (!line || /^zip\s*code/i.test(line)) continue;
          const parts = line.split(',');
          if (parts.length < 3) continue;
          const zip = String(parts[0]).replace(/\D/g, '');
          const city = String(parts[1]).trim();
          const county = String(parts.slice(2).join(',')).trim();
          if (!zip || !city || !county) continue;
          const row = { zip, city, county };
          rows.push(row);
          byZip.set(zip, row);
          const zset = cityToZips.get(city) || new Set();
          zset.add(zip);
          cityToZips.set(city, zset);
          const cset = cityToCounties.get(city) || new Set();
          cset.add(county);
          cityToCounties.set(city, cset);
        }
        const cities = Array.from(new Set(rows.map(r => r.city))).sort((a,b)=>a.localeCompare(b));
        const counties = Array.from(new Set(rows.map(r => r.county))).sort((a,b)=>a.localeCompare(b));
        if (!cancelled) setNcData({ rows, byZip, cityToZips, cityToCounties, cities, counties });
      } catch {}
    };
    loadNcCsv();
    return () => { cancelled = true; };
  }, []);

  const handleChange = (key, value) => {
    setDetails(prev => ({ ...prev, [key]: value }));
  };

  // Dependent dropdown handlers for Country -> Province/State -> City -> Zip/Postal
  const handleCountryChange = (value) => {
    const country = findCountry(value);
    setDetails(prev => ({
      ...prev,
      country: country ? country.name : value,
      state_prov: '',
      city: '',
      zip_postal_code: ''
    }));
  };

  const handleProvinceChange = (value) => {
    const country = findCountry(details.country);
    const province = findProvince(country, value);
    setDetails(prev => ({
      ...prev,
      state_prov: province ? province.name : value,
      city: '',
      zip_postal_code: ''
    }));
  };

  const handleCityChange = (value) => {
    const country = findCountry(details.country);
    const province = findProvince(country, details.state_prov);
    const city = findCity(province, value);

    let countyFromCity = '';
    if (isNC && ncData.cityToCounties.size) {
      const set = ncData.cityToCounties.get(city ? city.name : value) || new Set();
      if (set.size === 1) countyFromCity = Array.from(set)[0];
    }

    setDetails(prev => ({
      ...prev,
      city: city ? city.name : value,
      county: countyFromCity || prev.county || '',
      zip_postal_code: ''
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await loopAPI.updateLoop(loopId, { details });
      addNotification('Details saved', 'success');
      if (typeof onSaved === 'function') onSaved();
    } catch (e) {
      addNotification(apiUtils.getErrorMessage(e), 'error');
    } finally { setSaving(false); }
  };

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h3 className="text-lg font-semibold">Details</h3>
        <button className={`btn btn-primary btn-sm ${saving ? 'opacity-70 pointer-events-none' : ''}`} onClick={handleSave} disabled={saving}>
          Save
        </button>
      </div>
      <div className="card-body space-y-8">
        {DETAILS_GROUPS.map((g) => (
          <section key={g.title}>
            <h4 className="font-semibold text-gray-900 mb-3">{g.title}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {g.fields.map(([key, label]) => {
                if (key === 'country') {
                  const selected = findCountry(details.country);
                  return (
                    <div key={key} className="flex flex-col">
                      <label htmlFor={key} className="text-sm text-gray-700 mb-1">{label}</label>
                      <select id={key} value={selected?.name || details.country || ''} onChange={(e)=>handleCountryChange(e.target.value)}>
                        <option value="">Select Country</option>
                        {locationData.map(c => (
                          <option key={c.code} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  );
                }
                if (key === 'state_prov') {
                  const country = findCountry(details.country);
                  const provinces = country?.provinces || [];
                  const hasOptions = provinces.length > 0;
                  return (
                    <div key={key} className="flex flex-col">
                      <label htmlFor={key} className="text-sm text-gray-700 mb-1">{label}</label>
                      {hasOptions ? (
                        <select id={key} value={details.state_prov || ''} onChange={(e)=>handleProvinceChange(e.target.value)}>
                          <option value="">Select Province/State</option>
                          {provinces.map(p => (
                            <option key={p.code} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      ) : (
                        <input id={key} type="text" value={details[key] || ''} onChange={(e)=>handleChange(key, e.target.value)} />
                      )}
                    </div>
                  );
                }
                if (key === 'city') {
                  const country = findCountry(details.country);
                  const province = findProvince(country, details.state_prov);
                  const cities = province?.cities || [];
                  const hasOptions = cities.length > 0;
                  return (
                    <div key={key} className="flex flex-col">
                      <label htmlFor={key} className="text-sm text-gray-700 mb-1">{label}</label>
                      {hasOptions ? (
                        <select id={key} value={details.city || ''} onChange={(e)=>handleCityChange(e.target.value)}>
                          <option value="">Select City</option>
                          {cities.map(c => (
                            <option key={c.name} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      ) : (
                        <input id={key} type="text" value={details[key] || ''} onChange={(e)=>handleChange(key, e.target.value)} />
                      )}
                    </div>
                  );
                }
                if (key === 'zip_postal_code') {
                  const country = findCountry(details.country);
                  const province = findProvince(country, details.state_prov);
                  const city = findCity(province, details.city);
                  const zips = (city?.zips && city.zips.length ? city.zips : (province?.zips || []));
                  const hasOptions = zips.length > 0;
                  return (
                    <div key={key} className="flex flex-col">
                      <label htmlFor={key} className="text-sm text-gray-700 mb-1">{label}</label>
                      {hasOptions ? (
                        <select id={key} value={details.zip_postal_code || ''} onChange={(e)=>handleChange('zip_postal_code', e.target.value)}>
                          <option value="">Select Zip/Postal Code</option>
                          {zips.map(z => (
                            <option key={z} value={z}>{z}</option>
                          ))}
                        </select>
                      ) : (
                        <input id={key} type="text" value={details[key] || ''} onChange={(e)=>handleChange(key, e.target.value)} />
                      )}
                    </div>
                  );
                }
                return (
                  <div key={key} className="flex flex-col">
                    <label htmlFor={key} className="text-sm text-gray-700 mb-1">{label}</label>
                    <input id={key} type="text" value={details[key] || ''} onChange={(e)=>handleChange(key, e.target.value)} />
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default LoopDetails;

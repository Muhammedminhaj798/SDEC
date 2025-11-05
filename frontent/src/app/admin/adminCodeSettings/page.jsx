// src/pages/AdminCodSettings.js
'use client'
import React from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { useCodSettings } from '@/app/hooks/settingsHook/page';

const zones = ['Urban', 'Semi-Urban', 'Rural', 'Metro', 'Tier-2', 'Tier-3'];

const AdminCodSettings = () => {
  const { settings, updateSettings } = useCodSettings();

  const handleAdvanceChange = (e) => {
    const value = Math.max(0, Math.min(100, Number(e.target.value) || 0));
    updateSettings({ advancePercent: value });
  };

  const handleZoneToggle = (zone) => {
    const newZones = settings.allowedZones.includes(zone)
      ? settings.allowedZones.filter(z => z !== zone)
      : [...settings.allowedZones, zone];
    updateSettings({ allowedZones: newZones });
  };

  const handleEnabledChange = (e) => {
    updateSettings({ enabled: e.target.checked });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">COD Settings</h1>
          <p className="text-gray-600">Configure Cash on Delivery options for your store</p>
        </div>

        {/* Main Settings Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          {/* Enable COD Section */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Enable COD</h2>
                <p className="text-sm text-gray-500 mt-1">Allow customers to pay cash on delivery</p>
              </div>
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={handleEnabledChange}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
            {!settings.enabled && (
              <div className="mt-3 flex items-center text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                COD is currently disabled for all customers
              </div>
            )}
          </div>

          {/* Advance Payment Section */}
          <div className="px-6 py-6 border-b border-gray-100">
            <div className="mb-4">
              <label className="block text-base font-semibold text-gray-900 mb-1">
                Advance Payment Percentage
              </label>
              <p className="text-sm text-gray-500 mb-4">Set the percentage customers must pay in advance for COD orders</p>
            </div>
            
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.advancePercent}
                    onChange={handleAdvanceChange}
                    className="w-full px-4 py-3 text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-lg font-semibold text-gray-500">%</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>Minimum: 0%</span>
                  <span>Maximum: 100%</span>
                </div>
              </div>
              
              {/* Visual Indicator */}
              <div className="w-24 h-24 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <span className="text-2xl font-bold text-blue-600">{settings.advancePercent}%</span>
                <span className="text-xs text-gray-600 mt-1">Advance</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${settings.advancePercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Allowed Zones Section */}
          <div className="px-6 py-6">
            <div className="mb-4">
              <label className="block text-base font-semibold text-gray-900 mb-1">
                Allowed Delivery Zones
              </label>
              <p className="text-sm text-gray-500">Select the zones where COD is available</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {zones.map((zone) => {
                const isChecked = settings.allowedZones.includes(zone);
                return (
                  <label 
                    key={zone} 
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isChecked 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleZoneToggle(zone)}
                      className="sr-only peer"
                    />
                    <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-all ${
                      isChecked 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {isChecked && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm font-medium ${isChecked ? 'text-blue-900' : 'text-gray-700'}`}>
                      {zone}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Zone Summary */}
            <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{settings.allowedZones.length} zones selected</span>
              </div>
              <RefreshCw className="w-4 h-4 text-green-500 animate-spin" />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <button className="w-full flex items-center justify-center py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all shadow-md hover:shadow-lg">
            <Save className="w-5 h-5 mr-2" />
            Settings Saved 
          </button>
          <p className="text-center text-xs text-gray-500 mt-3">
            Changes are automatically synced across all channels
          </p>
        </div>

        {/* Info Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Advance Payment</h3>
                <p className="text-xs text-blue-700">Collecting advance payment reduces order cancellations and helps manage cash flow better</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-purple-900 mb-1">Zone Selection</h3>
                <p className="text-xs text-purple-700">Enable COD only in zones where you have reliable delivery partners and lower return rates</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCodSettings;
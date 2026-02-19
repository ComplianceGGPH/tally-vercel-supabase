'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Home, Search, ExternalLink, Download } from 'lucide-react';

export default function GuideVerificationAdmin() {
    const [icNumber, setIcNumber] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        console.log('Button clicked, icNumber =', icNumber);
        setResult(null);         // clear previous result
        setLoading(true);        // start loading

        try {
            const response = await fetch('/api/check-ic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ icNumber }),
            });

            const data = await response.json();
            console.log('API response:', data);
            
            if (!response.ok) {
                // Show the actual error message from the API
                setResult({ message: data.message || `Error: ${response.status} - ${response.statusText}` });
                return;
            }

            setResult(data);
        } catch (error) {
            console.error('Fetch error:', error);
            setResult({ message: `Error: ${error.message}. Please check if environment variables are configured.` });
        } finally {
            setLoading(false);     // end loading
        }
    };

    const generatePDF = async (type, activity = null) => {
        try {
            const response = await fetch('/api/generate-guide-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ icNumber, type, activity }),
            });

            if (!response.ok) {
                const error = await response.json();
                alert(`Error: ${error.message || 'Failed to generate PDF'}`);
                return;
            }

            // Download the PDF
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `guide_${type}_${result.RegNo}_${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('PDF Generation error:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    return (
        <>
            <style jsx global>{`
                @media print {
                    body { 
                        background: white !important; 
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                    .print\\:hidden { display: none !important; }
                    .print\\:break-inside-avoid { break-inside: avoid; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    @page { 
                        margin: 1.5cm; 
                        size: A4;
                    }
                }
            `}</style>
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 print:bg-white">
                <div className="max-w-7xl mx-auto p-6 space-y-8 print:p-4">
                {/* Logo Section */}
                <div className="bg-white rounded-lg shadow-sm p-6 print:shadow-none print:break-inside-avoid">
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4 items-center justify-items-center">
                        {[
                            { src: "/logo/ggp.png", name: "GGP" },
                            { src: "/logo/gct.png", name: "GCT" },
                            { src: "/logo/pwap.png", name: "PWAP" },
                            { src: "/logo/lrc.png", name: "LRC" },
                            { src: "/logo/botani.png", name: "Botani" },
                            { src: "/logo/glow.png", name: "GLOW" },
                        ].map((logo, index) => (
                            <div key={index} className="grayscale hover:grayscale-0 transition-all">
                                <Image src={logo.src} alt={logo.name} width={100} height={80} className="object-contain" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight">Guide Administration Portal</h1>
                    <p className="text-muted-foreground text-lg">Access and generate official guide credentials and certification documents</p>
                </div>

                {/* Back to Home Button */}
                <div className="flex justify-start print:hidden">
                    <Link href="/">
                        <Button variant="outline" className="gap-2">
                            <Home className="h-4 w-4" />
                            Back to Home
                        </Button>
                    </Link>
                </div>

                {/* Search Card */}
                <Card className="max-w-2xl mx-auto print:hidden">
                    <CardHeader>
                        <CardTitle>Guide Lookup</CardTitle>
                        <CardDescription>Enter the guide's IC/NRIC number to retrieve their credentials and certificates</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                type="text"
                                placeholder="Enter IC/NRIC Number (e.g., 901234-56-7890)"
                                value={icNumber}
                                onChange={(e) => setIcNumber(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                                className="flex-1"
                            />
                            <Button onClick={fetchData} disabled={loading} className="gap-2">
                                <Search className="h-4 w-4" />
                                {loading ? 'Searching...' : 'Retrieve'}
                            </Button>
                        </div>

                        {loading && (
                            <div className="text-center py-4">
                                <p className="text-muted-foreground animate-pulse">Loading...</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Error Message */}
                {result && result.message && (
                    <Card className="max-w-2xl mx-auto border-destructive print:hidden">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 text-destructive">
                                <p>{result.message}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Results */}
                {result && !result.message && (
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Guide Info Card */}
                        <Card className="print:shadow-none">
                            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-2xl">{result.name}</CardTitle>
                                        <CardDescription className="text-base mt-1">
                                            Official Registration Number: <span className="font-semibold text-foreground">{result.RegNo}</span>
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* Activity Documents Card */}
                        <Card className="print:shadow-none">
                            <CardHeader className="border-b">
                                <CardTitle className="text-xl">Official Credentials & Certifications</CardTitle>
                                <CardDescription>Download guide identification cards and activity certificates by specialization</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {[
                                        { key: 'WWRFTR', label: 'White Water Rafting / Fun Trip Rafting' },
                                        { key: 'WA', label: 'Waterfall Abseiling' },
                                        { key: 'ATV', label: 'All-Terrain Vehicle' },
                                        { key: 'PB', label: 'Paintball' },
                                        { key: 'SHJTCE', label: 'Sunset Hiking / Jungle Trekking / Cave Exploration' },
                                        { key: 'TMTB', label: 'Telematch / Team Building' },
                                        { key: 'DRIVER', label: 'Driver' }
                                    ].map((activity, index) => {
                                        const tier = result[activity.key];
                                        const isTier1 = tier === 'TIER 1';
                                        const isNill = tier === 'NILL';
                                        
                                        const getTierBadge = (tier) => {
                                            if (tier === 'NILL') return 'bg-gray-100 text-gray-600';
                                            if (tier === 'TIER 1') return 'bg-blue-100 text-blue-700';
                                            if (tier === 'TIER 2') return 'bg-green-100 text-green-700';
                                            if (tier === 'TIER 3') return 'bg-purple-100 text-purple-700';
                                            return 'bg-gray-100 text-gray-600';
                                        };

                                        return (
                                            <div key={index} className="flex items-center justify-between p-5 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all print:break-inside-avoid">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-base text-gray-900">{activity.label}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <p className="text-sm text-gray-600">Certification Level:</p>
                                                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getTierBadge(tier)}`}>
                                                            {tier || 'Not Certified'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 print:hidden">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => generatePDF('card', activity.key)}
                                                        disabled={isNill}
                                                        className="gap-1 hover:bg-blue-50"
                                                        title={isNill ? 'Not certified for this activity' : 'Download ID Card'}
                                                    >
                                                        <Download className="h-3 w-3" />
                                                        ID Card
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => generatePDF('certificate', activity.key)}
                                                        disabled={isTier1 || isNill}
                                                        className="gap-1 hover:bg-green-50"
                                                        title={isTier1 ? 'Tier 1 does not require certificate' : isNill ? 'Not certified for this activity' : 'Download Certificate'}
                                                    >
                                                        <Download className="h-3 w-3" />
                                                        Certificate
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {/* Information Box */}
                                <div className="mt-6 space-y-3">
                                    <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded print:break-inside-avoid">
                                        <p className="text-sm text-blue-900 leading-relaxed">
                                            <strong className="font-semibold">📋 Document Information:</strong>
                                            <br />
                                            All credentials and certificates are generated dynamically from the official database.
                                        </p>
                                    </div>
                                    
                                    <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded print:break-inside-avoid">
                                        <p className="text-sm text-amber-900 leading-relaxed">
                                            <strong className="font-semibold">ℹ️ Certification Guidelines:</strong>
                                            <br />
                                            • <strong>TIER 1</strong> guides receive identification cards only
                                            <br />
                                            • <strong>TIER 2 & 3</strong> guides receive both cards and certificates
                                            <br />
                                            • Activities marked as "Not Certified" indicate no qualification for that specialization
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
        </>
    );
}

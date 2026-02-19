'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Home, Search } from 'lucide-react';

export default function GuideVerification() {
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

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className="max-w-7xl mx-auto p-6 space-y-8">
                {/* Logo Section */}
                <div className="bg-white rounded-lg shadow-sm p-6">
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
                    <h1 className="text-4xl font-bold tracking-tight">Guide Verification</h1>
                    <p className="text-muted-foreground text-lg">Verify guide credentials and activity competency levels</p>
                </div>

                {/* Back to Home Button */}
                <div className="flex justify-start">
                    <Link href="/">
                        <Button variant="outline" className="gap-2">
                            <Home className="h-4 w-4" />
                            Back to Home
                        </Button>
                    </Link>
                </div>

                {/* Search Card */}
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>Search by IC Number</CardTitle>
                        <CardDescription>Enter the guide's IC number to view their credentials</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                type="text"
                                placeholder="IC NUMBER (e.g., 901234567890)"
                                value={icNumber}
                                onChange={(e) => setIcNumber(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                                className="flex-1"
                            />
                            <Button onClick={fetchData} disabled={loading} className="gap-2">
                                <Search className="h-4 w-4" />
                                {loading ? 'Searching...' : 'Search'}
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
                    <Card className="max-w-2xl mx-auto border-destructive">
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
                        <Card>
                            <CardHeader>
                                <CardTitle>Guide Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Full Name</p>
                                        <p className="font-semibold text-lg">{result.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Nickname</p>
                                        <p className="font-semibold text-lg">{result.nickname}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Registration No</p>
                                        <p className="font-semibold text-lg">{result.RegNo}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Activity Competency Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Activity Competency Levels</CardTitle>
                                <CardDescription>Certified activity levels for this guide</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {[
                                        { label: 'White Water Rafting / Fun Trip Rafting', key: 'WWRFTR' },
                                        { label: 'Waterfall Abseiling', key: 'WA' },
                                        { label: 'ATV', key: 'ATV' },
                                        { label: 'Paintball', key: 'PB' },
                                        { label: 'Sunset Hiking / Jungle Trekking / Cave Exploration', key: 'SHJTCE' },
                                        { label: 'Telematch / Team Building', key: 'TMTB' },
                                        { label: 'Driver', key: 'DRIVER' },
                                    ].map((activity, index) => {
                                        const level = result[activity.key];
                                        const badgeColor = level === 'TIER 1' ? 'bg-blue-500' : level === 'TIER 2' ? 'bg-green-500' : 'bg-gray-400';
                                        return (
                                            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                                <span className="font-medium">{activity.label}</span>
                                                <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${badgeColor}`}>
                                                    {level || 'NILL'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
                                    <p className="text-sm text-amber-900">
                                        <strong>Note:</strong> To update your competency level, please submit your latest certificates through the admin.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}

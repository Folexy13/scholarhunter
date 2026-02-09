'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/lib/api-client';
import { ArrowLeft, Calendar, DollarSign, Globe, GraduationCap, Building2, ExternalLink } from 'lucide-react';

interface Scholarship {
  id: string;
  name: string;
  organization: string;
  description: string;
  amount: number | null;
  currency: string;
  deadline: string;
  country: string[];
  degreeLevel: string[];
  fieldOfStudy: string[];
  eligibility: string[] | Record<string, unknown>; // Can be JSON object or array
  requirements: string[];
  applicationUrl: string;
  category: string[];
  isActive: boolean;
  matchScore?: number;
}

export default function ScholarshipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get eligibility as array
  const getEligibilityArray = (eligibility: string[] | Record<string, unknown>): string[] => {
    if (Array.isArray(eligibility)) {
      return eligibility;
    }
    // If it's an object, try to extract values
    if (typeof eligibility === 'object' && eligibility !== null) {
      return Object.values(eligibility).filter((v): v is string => typeof v === 'string');
    }
    return [];
  };

  // Helper function to check if deadline has passed
  const isExpired = (deadline: string): boolean => {
    return new Date(deadline) < new Date();
  };

  useEffect(() => {
    const fetchScholarship = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/scholarships/${params.id}`);
        setScholarship(response.data);
      } catch (err) {
        console.error('Error fetching scholarship:', err);
        const errorMessage = err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to load scholarship details';
        setError(errorMessage || 'Failed to load scholarship details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchScholarship();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading scholarship details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !scholarship) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error || 'Scholarship not found'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/matches')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Scholarships
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/matches')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Scholarships
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{scholarship.name}</h1>
            <p className="text-xl text-muted-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {scholarship.organization}
            </p>
          </div>
          {scholarship.matchScore && (
            <Badge variant="default" className="text-lg px-4 py-2">
              {scholarship.matchScore}% Match
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>About This Scholarship</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {scholarship.description}
              </p>
            </CardContent>
          </Card>

          {/* Eligibility */}
          {scholarship.eligibility && getEligibilityArray(scholarship.eligibility).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Eligibility Criteria</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {getEligibilityArray(scholarship.eligibility).map((criterion: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Requirements */}
          {scholarship.requirements && scholarship.requirements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Application Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {scholarship.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{requirement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Quick Info */}
        <div className="space-y-6">
          {/* Key Information */}
          <Card>
            <CardHeader>
              <CardTitle>Key Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Amount */}
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Award Amount</p>
                  <p className="font-semibold">
                    {scholarship.amount
                      ? `${scholarship.currency} ${scholarship.amount.toLocaleString()}`
                      : 'Varies'}
                  </p>
                </div>
              </div>

              {/* Deadline */}
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Application Deadline</p>
                  <p className={`font-semibold ${isExpired(scholarship.deadline) ? 'text-red-500' : ''}`}>
                    {new Date(scholarship.deadline).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {isExpired(scholarship.deadline) && (
                      <span className="ml-2 text-xs">(Expired)</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Country */}
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Country</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {scholarship.country.map((c, index) => (
                      <Badge key={index} variant="secondary">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Degree Level */}
              <div className="flex items-start gap-3">
                <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Degree Level</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {scholarship.degreeLevel.map((level, index) => (
                      <Badge key={index} variant="secondary">
                        {level}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Field of Study */}
              {scholarship.fieldOfStudy && scholarship.fieldOfStudy.length > 0 && (
                <div className="flex items-start gap-3">
                  <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Field of Study</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {scholarship.fieldOfStudy.map((field, index) => (
                        <Badge key={index} variant="outline">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Apply Button */}
          <Card>
            <CardContent className="pt-6">
              <Button
                className="w-full"
                size="lg"
                onClick={() => window.open(scholarship.applicationUrl, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Apply Now
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                You will be redirected to the official application page
              </p>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={scholarship.isActive && !isExpired(scholarship.deadline) ? 'default' : 'secondary'}>
                  {scholarship.isActive && !isExpired(scholarship.deadline) ? 'Active' : isExpired(scholarship.deadline) ? 'Expired' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

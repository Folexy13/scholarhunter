"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Mail, Phone, MapPin, GraduationCap, Award, Plus, X, Save, Sparkles, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "react-hot-toast";
import { usersApi } from "@/lib/api";

interface ProfileFormData {
  bio?: string;
  phone?: string;
  location?: string;
  citizenship?: string;
  dateOfBirth?: string;
  gpa?: string; // Changed to string to support formats like "4.25/5" or "3.25"
  major?: string;
  university?: string;
  graduationYear?: number;
  linkedIn?: string;
  website?: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [matchingProgress, setMatchingProgress] = useState(0);
  const [matchingStatus, setMatchingStatus] = useState("");
  
  // Use persisted form data
  const [profile, setProfile, clearProfileData] = useFormPersistence<ProfileFormData>(
    'profile-form-data',
    {
      bio: "",
      phone: "",
      location: "",
      citizenship: "",
      dateOfBirth: "",
      gpa: "",
      major: "",
      university: "",
      graduationYear: undefined,
      linkedIn: "",
      website: "",
    }
  );

  const fetchProfile = async () => {
    try {
      const data = await usersApi.getProfile();
      if (data) {
        // Only update if there's no persisted data (first load)
        if (!profile.bio && !profile.phone && !profile.major) {
          setProfile({
            bio: data.bio || "",
            phone: data.phone || "",
            location: data.location || "",
            citizenship: data.citizenship || "",
            dateOfBirth: data.dateOfBirth || "",
            gpa: data.gpa?.toString() || "",
            major: data.major || "",
            university: data.university || "",
            graduationYear: data.graduationYear,
            linkedIn: data.linkedIn || "",
            website: data.website || "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const simulateMatching = () => {
    setMatchingStatus("Analyzing your profile...");
    setMatchingProgress(20);

    setTimeout(() => {
      setMatchingStatus("Searching scholarship databases...");
      setMatchingProgress(40);
    }, 1000);

    setTimeout(() => {
      setMatchingStatus("Matching opportunities to your profile...");
      setMatchingProgress(60);
    }, 2000);

    setTimeout(() => {
      setMatchingStatus("Ranking best matches...");
      setMatchingProgress(80);
    }, 3000);

    setTimeout(() => {
      setMatchingStatus("Complete!");
      setMatchingProgress(100);
      
      // Show success modal after a brief delay
      setTimeout(() => {
        setShowSuccessModal(true);
      }, 500);
    }, 4000);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Prepare data for backend (only send fields that match the DTO)
      const updateData: Partial<ProfileFormData> = {
        bio: profile.bio,
        phone: profile.phone,
        location: profile.location,
        citizenship: profile.citizenship,
        gpa: profile.gpa,
        major: profile.major,
        university: profile.university,
        graduationYear: profile.graduationYear,
        linkedIn: profile.linkedIn,
        website: profile.website,
      };

      // Convert dateOfBirth to ISO string if provided
      if (profile.dateOfBirth) {
        updateData.dateOfBirth = new Date(profile.dateOfBirth).toISOString();
      }

      await usersApi.updateProfile(updateData);
      toast.success("Profile updated successfully");
      setIsEditing(false);
      
      // Clear persisted form data after successful save
      clearProfileData();
      
      // Start matching simulation
      simulateMatching();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
      setIsSaving(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    setIsSaving(false);
    setMatchingProgress(0);
    setMatchingStatus("");
    router.push("/matches");
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6 lg:p-10 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Profile</h1>
            <p className="text-muted-foreground">
              Manage your personal information and preferences
            </p>
          </div>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    fetchProfile();
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>Your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={user?.firstName || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={user?.lastName || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email
                </Label>
                <Input id="email" type="email" value={user?.email || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={profile.dateOfBirth}
                  onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="citizenship">Citizenship</Label>
                <Input
                  id="citizenship"
                  value={profile.citizenship}
                  onChange={(e) => setProfile({ ...profile, citizenship: e.target.value })}
                  disabled={!isEditing}
                  placeholder="e.g., American"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                disabled={!isEditing}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
            </CardTitle>
            <CardDescription>Where you currently live</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                disabled={!isEditing}
                placeholder="e.g., New York, NY, United States"
              />
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Academic Information
            </CardTitle>
            <CardDescription>Your educational background and goals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="major">Major / Field of Study</Label>
                <Input
                  id="major"
                  value={profile.major}
                  onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                  disabled={!isEditing}
                  placeholder="e.g., Computer Science"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                <Input
                  id="university"
                  value={profile.university}
                  onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                  disabled={!isEditing}
                  placeholder="e.g., MIT"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="graduationYear">Graduation Year</Label>
                <Input
                  id="graduationYear"
                  type="number"
                  min="1900"
                  max="2100"
                  value={profile.graduationYear || ""}
                  onChange={(e) => setProfile({ ...profile, graduationYear: parseInt(e.target.value) || undefined })}
                  disabled={!isEditing}
                  placeholder="e.g., 2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gpa">GPA / CGPA</Label>
                <Input
                  id="gpa"
                  type="text"
                  value={profile.gpa}
                  onChange={(e) => setProfile({ ...profile, gpa: e.target.value })}
                  disabled={!isEditing}
                  placeholder="e.g., 3.75/4.0 or 4.25/5.0"
                />
                <p className="text-xs text-muted-foreground">
                  Enter your GPA with scale (e.g., 3.75/4.0) or just the value (e.g., 3.75)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Professional Links
            </CardTitle>
            <CardDescription>Your online presence</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedIn">LinkedIn</Label>
                <Input
                  id="linkedIn"
                  type="url"
                  value={profile.linkedIn}
                  onChange={(e) => setProfile({ ...profile, linkedIn: e.target.value })}
                  disabled={!isEditing}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Personal Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={profile.website}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  disabled={!isEditing}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matching Progress Modal */}
      <Dialog open={isSaving && matchingProgress > 0 && !showSuccessModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              Finding Your Matches
            </DialogTitle>
            <DialogDescription>
              Our AI is analyzing your profile and matching you with scholarships
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{matchingStatus}</span>
                <span className="font-bold text-primary">{matchingProgress}%</span>
              </div>
              <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-500 ease-out"
                  style={{ width: `${matchingProgress}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-center py-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Award className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              Profile Updated Successfully!
            </DialogTitle>
            <DialogDescription>
              We&apos;ve found scholarship matches tailored to your profile
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-lg">Matching Complete!</p>
                  <p className="text-sm text-muted-foreground">Ready to view your top matches</p>
                </div>
              </div>
            </div>
            <Button onClick={handleModalClose} className="w-full" size="lg">
              View My Matches
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api/axios";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Search, Building2, UserCheck, X } from "lucide-react";
import { useCountryStore } from "@/lib/store/countryStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Partner = {
  _id: string;
  name: string;
  type: "FLEET" | "MECHANIC" | "INSURANCE";
  partnerCode: string;
  contactEmail: string;
  contactPhone: string;
  country: string;
  countryCode: string;
  workspace: string;
  status: string;
  createdAt: string;
};

export default function PartnersPage() {
  const { countryCode } = useCountryStore();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsAddSubmitting] = useState(false);
  const [newPartner, setNewPartner] = useState({
    name: "",
    type: "FLEET",
    partnerCode: "",
    contactEmail: "",
    contactPhone: "",
    country: "South Africa",
    countryCode: "ZA",
    workspace: "default"
  });

  const loadPartners = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/partners", {
        params: { countryCode },
      });
      setPartners(res.data.partners || []);
    } catch (err) {
      console.error("Failed to load partners", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPartner = async () => {
    try {
      setIsAddSubmitting(true);
      await api.post("/api/admin/partners", {
        ...newPartner,
        countryCode // Use global countryCode from store
      });
      toast.success("Partner created and invitation sent!");
      setIsAddModalOpen(false);
      loadPartners();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create partner");
    } finally {
      setIsAddSubmitting(false);
    }
  };

  useEffect(() => {
    if (countryCode) loadPartners();
  }, [countryCode]);

  const filtered = partners.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.partnerCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Partner Management"
        description="Manage Fleet and Mechanic companies."
      />

      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search partners..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Partner
        </Button>
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Add New Partner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Partner Name</label>
              <Input
                placeholder="e.g. Acme Fleet Services"
                value={newPartner.name}
                onChange={(e) => setNewPartner({...newPartner, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">Type</label>
                <Select
                  value={newPartner.type}
                  onValueChange={(v) => setNewPartner({...newPartner, type: v as any})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="FLEET">FLEET</SelectItem>
                    <SelectItem value="MECHANIC">MECHANIC</SelectItem>
                    <SelectItem value="INSURANCE">INSURANCE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">Partner Code</label>
                <Input
                  placeholder="e.g. ACME-001"
                  value={newPartner.partnerCode}
                  onChange={(e) => setNewPartner({...newPartner, partnerCode: e.target.value.toUpperCase()})}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Contact Email</label>
              <Input
                type="email"
                placeholder="admin@acme.com"
                value={newPartner.contactEmail}
                onChange={(e) => setNewPartner({...newPartner, contactEmail: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Contact Phone</label>
              <Input
                placeholder="+27..."
                value={newPartner.contactPhone}
                onChange={(e) => setNewPartner({...newPartner, contactPhone: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAddPartner}
              disabled={isSubmitting || !newPartner.name || !newPartner.partnerCode || !newPartner.contactEmail}
            >
              {isSubmitting ? "Creating..." : "Create Partner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">All Partners</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    Loading partners...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No partners found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell className="font-bold">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        p.type === "FLEET" ? "border-blue-200 text-blue-700 bg-blue-50" :
                        p.type === "MECHANIC" ? "border-orange-200 text-orange-700 bg-orange-50" :
                        "border-green-200 text-green-700 bg-green-50"
                      }>
                        {p.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.partnerCode}</TableCell>
                    <TableCell>
                      <div className="text-xs">{p.contactEmail}</div>
                      <div className="text-[10px] text-muted-foreground">{p.contactPhone}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={p.status === "ACTIVE" ? "bg-green-600" : "bg-slate-400"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Manage</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

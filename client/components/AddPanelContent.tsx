import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type AddNewType = "customer" | "account" | "ticket" | "work-item";

const addNewFieldConfig: Record<
  AddNewType,
  Array<{
    key: string;
    label: string;
    placeholder: string;
    type: "input" | "textarea";
  }>
> = {
  customer: [
    { key: "firstName", label: "First Name", placeholder: "Enter first name", type: "input" },
    { key: "lastName", label: "Last Name", placeholder: "Enter last name", type: "input" },
    { key: "email", label: "Email", placeholder: "name@example.com", type: "input" },
    { key: "phone", label: "Phone", placeholder: "(555) 123-4567", type: "input" },
    { key: "customerId", label: "Customer ID", placeholder: "CST-10482", type: "input" },
    { key: "notes", label: "Notes", placeholder: "Add customer notes", type: "textarea" },
  ],
  account: [
    { key: "accountName", label: "Account Name", placeholder: "Premier Account", type: "input" },
    { key: "accountNumber", label: "Account Number", placeholder: "ACC-20391", type: "input" },
    { key: "owner", label: "Owner", placeholder: "Alex Kowalski", type: "input" },
    { key: "status", label: "Status", placeholder: "Active", type: "input" },
    { key: "billingAddress", label: "Billing Address", placeholder: "Add billing address", type: "textarea" },
  ],
  ticket: [
    { key: "title", label: "Ticket Title", placeholder: "Payment mismatch preventing upgrade", type: "input" },
    { key: "priority", label: "Priority", placeholder: "High", type: "input" },
    { key: "category", label: "Category", placeholder: "Billing", type: "input" },
    { key: "customer", label: "Customer", placeholder: "Alex Kowalski", type: "input" },
    { key: "description", label: "Description", placeholder: "Describe the issue", type: "textarea" },
  ],
  "work-item": [
    { key: "name", label: "Work Item Name", placeholder: "Resolve billing mismatch", type: "input" },
    { key: "assignee", label: "Assignee", placeholder: "Jordan Doe", type: "input" },
    { key: "dueDate", label: "Due Date", placeholder: "03/15/26", type: "input" },
    { key: "relatedTo", label: "Related To", placeholder: "Ticket TCK-2091", type: "input" },
    { key: "details", label: "Details", placeholder: "Add work item details", type: "textarea" },
  ],
};

export default function AddPanelContent() {
  const [selectedType, setSelectedType] = useState<AddNewType>("customer");
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const fields = addNewFieldConfig[selectedType];
  const isSaveDisabled = fields.some((field) => !(formValues[field.key] ?? "").trim());

  const clearForm = () => {
    setFormValues({});
  };

  const handleSave = () => {
    if (isSaveDisabled) return;

    clearForm();
    toast.success("Customer Saved Successfully", {
      action: {
        label: "Open Record",
        onClick: () => undefined,
      },
    });
  };

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF]">
              Item Type
            </label>
            <Select value={selectedType} onValueChange={(value) => setSelectedType(value as AddNewType)}>
              <SelectTrigger className="h-9 rounded border border-[#E5E7EB] bg-[#F8F8F9] px-2.5 py-1.5 text-sm text-[#333333] focus:ring-1 focus:ring-[#006DAD]/30 focus:ring-offset-0 focus:border-[#006DAD]">
                <SelectValue placeholder="Select item type" />
              </SelectTrigger>
              <SelectContent className="z-[80] rounded border border-[#E5E7EB] bg-white">
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="ticket">Ticket</SelectItem>
                <SelectItem value="work-item">Work Item</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <label className="block text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF]">
                  {field.label}
                </label>
                {field.type === "textarea" ? (
                  <Textarea
                    value={formValues[field.key] ?? ""}
                    onChange={(event) =>
                      setFormValues((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="min-h-[96px] rounded border border-[#E5E7EB] bg-[#F8F8F9] px-2.5 py-1.5 text-sm text-[#333333] placeholder:text-transparent focus-visible:border-[#006DAD] focus-visible:ring-1 focus-visible:ring-[#006DAD]/30"
                  />
                ) : (
                  <Input
                    value={formValues[field.key] ?? ""}
                    onChange={(event) =>
                      setFormValues((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="h-9 rounded border border-[#E5E7EB] bg-[#F8F8F9] px-2.5 py-1.5 text-sm text-[#333333] placeholder:text-transparent focus-visible:border-[#006DAD] focus-visible:ring-1 focus-visible:ring-[#006DAD]/30"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
        <Button type="button" variant="outline" className="rounded-xl" onClick={clearForm}>
          Cancel
        </Button>
        <Button
          type="button"
          className="rounded-xl bg-[#006DAD] hover:bg-[#5B00D1] disabled:bg-[#B8D7F0] disabled:text-white"
          onClick={handleSave}
          disabled={isSaveDisabled}
        >
          Save
        </Button>
      </div>
    </>
  );
}

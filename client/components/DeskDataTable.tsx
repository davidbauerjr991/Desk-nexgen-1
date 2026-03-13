import { Box } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";

type DeskRow = {
  id: number;
  customerId: string;
  first: string;
  last: string;
  group: string;
  primaryPhone: string;
  emailAddress: string;
  address1: string;
  city: string;
  state: string;
};

const deskColumns: GridColDef<DeskRow>[] = [
  { field: "customerId", headerName: "CUSTOMER ID", minWidth: 110, flex: 1 },
  { field: "first", headerName: "FIRST", minWidth: 86, flex: 0.85 },
  { field: "last", headerName: "LAST", minWidth: 92, flex: 0.95 },
  { field: "group", headerName: "GROUP", minWidth: 88, flex: 0.9 },
  { field: "primaryPhone", headerName: "PRIMARY PHONE", minWidth: 130, flex: 1.15 },
  { field: "emailAddress", headerName: "EMAIL ADDRESS", minWidth: 132, flex: 1.2 },
  { field: "address1", headerName: "ADDRESS 1", minWidth: 118, flex: 1.05 },
  { field: "city", headerName: "CITY", minWidth: 84, flex: 0.8 },
  { field: "state", headerName: "STATE", minWidth: 78, flex: 0.7 },
];

const baseRows: DeskRow[] = [
  {
    id: 1,
    customerId: "2104",
    first: "Christina",
    last: "Adams",
    group: "",
    primaryPhone: "(716) 308-1763",
    emailAddress: "THArrington2...",
    address1: "1 SmartReach ...",
    city: "Buffalo",
    state: "New York",
  },
  {
    id: 2,
    customerId: "2457",
    first: "Hannah",
    last: "Mayer",
    group: "Insurance",
    primaryPhone: "(716) 331-4661",
    emailAddress: "Teresa.Harrin...",
    address1: "1 SmartReach ...",
    city: "Buffalo",
    state: "New York",
  },
  {
    id: 3,
    customerId: "6072818957",
    first: "josh",
    last: "robertson",
    group: "",
    primaryPhone: "(415) 671-6000",
    emailAddress: "devera.e@gm...",
    address1: "",
    city: "",
    state: "",
  },
  {
    id: 4,
    customerId: "ACCT33876",
    first: "jane",
    last: "Smith",
    group: "",
    primaryPhone: "(470) 207-9163",
    emailAddress: "jane.smith@fi...",
    address1: "3378 Main St",
    city: "Chicago",
    state: "CA",
  },
  {
    id: 5,
    customerId: "JJR",
    first: "",
    last: "",
    group: "",
    primaryPhone: "",
    emailAddress: "",
    address1: "",
    city: "",
    state: "",
  },
  {
    id: 6,
    customerId: "JJR_1",
    first: "Jason",
    last: "Queener",
    group: "",
    primaryPhone: "(607) 281-8957",
    emailAddress: "",
    address1: "",
    city: "",
    state: "",
  },
  {
    id: 7,
    customerId: "JJR_10",
    first: "amanda",
    last: "jack",
    group: "",
    primaryPhone: "(607) 281-8957",
    emailAddress: "joshua.robert...",
    address1: "",
    city: "",
    state: "",
  },
  {
    id: 8,
    customerId: "JJR_11",
    first: "carey",
    last: "diane",
    group: "",
    primaryPhone: "(607) 743-3206",
    emailAddress: "",
    address1: "",
    city: "",
    state: "",
  },
  {
    id: 9,
    customerId: "JJR_12",
    first: "jill",
    last: "carey",
    group: "",
    primaryPhone: "(607) 743-3206",
    emailAddress: "",
    address1: "",
    city: "",
    state: "",
  },
  {
    id: 10,
    customerId: "JJR_13",
    first: "jack",
    last: "jill",
    group: "",
    primaryPhone: "(607) 743-3206",
    emailAddress: "",
    address1: "",
    city: "",
    state: "",
  },
];

const generatedFirstNames = [
  "Alex",
  "Taylor",
  "Morgan",
  "Jordan",
  "Parker",
  "Avery",
  "Riley",
  "Quinn",
  "Casey",
  "Jamie",
  "Dakota",
];
const generatedLastNames = [
  "Bennett",
  "Carter",
  "Brooks",
  "Diaz",
  "Ellis",
  "Foster",
  "Gray",
  "Hayes",
  "Irwin",
  "James",
  "Knight",
];
const generatedGroups = ["Insurance", "Retail", "Support", "Sales", "Care"];
const generatedCities = ["Buffalo", "Chicago", "Austin", "Phoenix", "New York"];
const generatedStates = ["New York", "IL", "TX", "AZ", "NY"];

const generatedRows: DeskRow[] = Array.from({ length: 44 }, (_, index) => {
  const first = generatedFirstNames[index % generatedFirstNames.length];
  const last = generatedLastNames[index % generatedLastNames.length];
  const city = generatedCities[index % generatedCities.length];
  const state = generatedStates[index % generatedStates.length];

  return {
    id: index + 11,
    customerId: `${3100 + index}`,
    first,
    last,
    group: generatedGroups[index % generatedGroups.length],
    primaryPhone: `(716) 555-${(1200 + index).toString().padStart(4, "0")}`,
    emailAddress: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
    address1: `${100 + index} Market St`,
    city,
    state,
  };
});

const deskRows = [...baseRows, ...generatedRows];

export default function DeskDataTable() {
  return (
    <Box className="flex min-h-0 flex-1 overflow-hidden bg-white">
      <DataGrid
        rows={deskRows}
        columns={deskColumns}
        disableRowSelectionOnClick
        disableColumnFilter
        disableColumnMenu
        disableColumnSelector
        hideFooterSelectedRowCount
        rowHeight={38}
        columnHeaderHeight={42}
        pageSizeOptions={[25]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 25, page: 0 },
          },
        }}
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? "desk-row-even" : "desk-row-odd"
        }
        sx={{
          flex: 1,
          minHeight: 0,
          height: "100%",
          overflow: "hidden",
          border: 0,
          fontSize: "13px",
          color: "#333333",
          backgroundColor: "#FFFFFF",
          "& .MuiDataGrid-main": {
            overflow: "hidden",
          },
          "& .MuiDataGrid-virtualScroller": {
            overflowX: "auto",
            overflowY: "auto",
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#F3F4F6",
            borderBottom: "1px solid #D7DBE0",
          },
          "& .MuiDataGrid-columnHeader": {
            paddingInline: "8px",
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.01em",
            color: "#333333",
          },
          "& .MuiDataGrid-cell": {
            borderColor: "#E2E8F0",
            paddingInline: "8px",
          },
          "& .desk-row-even": {
            backgroundColor: "#FFFFFF",
          },
          "& .desk-row-odd": {
            backgroundColor: "#F9FAFB",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "#EEF6FC !important",
          },
          "& .MuiDataGrid-footerContainer": {
            minHeight: "46px",
            borderTop: "1px solid #D7DBE0",
            backgroundColor: "#FFFFFF",
            overflow: "hidden",
          },
          "& .MuiDataGrid-scrollbar--vertical": {
            top: "var(--DataGrid-headersTotalHeight)",
            bottom: "calc(var(--DataGrid-bottomContainerHeight) + var(--DataGrid-hasScrollX) * var(--DataGrid-scrollbarSize))",
            height: "auto",
          },
          "& .MuiTablePagination-root": {
            color: "#4B5563",
            fontSize: "12px",
          },
          "& .MuiDataGrid-scrollbarFiller": {
            backgroundColor: "#FFFFFF",
          },
          "& .MuiDataGrid-withBorderColor": {
            borderColor: "#D7DBE0",
          },
        }}
      />
    </Box>
  );
}

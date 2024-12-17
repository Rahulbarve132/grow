import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primeicons/primeicons.css";
import { OverlayPanel } from "primereact/overlaypanel";

const ArtworkTable = () => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtworks, setSelectedArtworks] = useState([]); // Tracks selected rows
  const [allSelected, setAllSelected] = useState(new Set()); // Tracks all selected IDs globally
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(0);
  const rowsPerPage = 12;

  const op = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState(""); // Feedback for UI

  useEffect(() => {
    fetchArtworks(page);
  }, [page]);

  const fetchArtworks = async (pageNumber) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.artic.edu/api/v1/artworks?page=${pageNumber + 1}&limit=${rowsPerPage}`
      );
      const data = await response.json();
      setArtworks(data.data || []);
      setTotalRecords(data.pagination?.total || 0);

      // Restore selection for rows on the current page
      const restoredSelection = data.data.filter((row) =>
        allSelected.has(row.id)
      );
      setSelectedArtworks(restoredSelection);
    } catch (error) {
      console.error("Error fetching artworks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleHeaderClick = (event) => {
    setFeedbackMessage(""); // Reset feedback
    op.current.toggle(event);
  };

  const handleSubmit = async () => {
    const numberToSelect = parseInt(inputValue, 10);

    if (!numberToSelect || numberToSelect <= 0) {
      setFeedbackMessage("Please enter a valid positive number.");
      return;
    }

    if (numberToSelect > totalRecords) {
      setFeedbackMessage(`Only ${totalRecords} rows are available.`);
      return;
    }

    setFeedbackMessage("");
    await selectRowsAcrossPages(numberToSelect);
  };

  const selectRowsAcrossPages = async (numberToSelect) => {
    let selectedRows = [];
    let currentPage = 0;

    while (selectedRows.length < numberToSelect) {
      const response = await fetch(
        `https://api.artic.edu/api/v1/artworks?page=${currentPage + 1}&limit=${rowsPerPage}`
      );
      const data = await response.json();
      const rowsToAdd = data.data.slice(0, numberToSelect - selectedRows.length);
      selectedRows = [...selectedRows, ...rowsToAdd];

      rowsToAdd.forEach((row) => allSelected.add(row.id)); // Update global selection
      if (data.data.length < rowsPerPage) break; // No more pages to fetch
      currentPage++;
    }

    setAllSelected(new Set(allSelected)); // Update global state
    setPage(0); // Reset to first page to show updated rows
    fetchArtworks(0); // Reload the first page
  };

  const onSelectionChange = (e) => {
    const selectedIds = new Set(allSelected);

    // Add selected rows to global selection
    e.value.forEach((row) => selectedIds.add(row.id));

    // Remove deselected rows from global selection
    selectedArtworks.forEach((row) => {
      if (!e.value.some((selected) => selected.id === row.id)) {
        selectedIds.delete(row.id);
      }
    });

    setAllSelected(selectedIds); // Update global selected rows

    // Update local selection
    setSelectedArtworks(e.value);
  };

  return (
    <div className="artwork-table">
      <DataTable
        value={artworks}
        responsiveLayout="scroll"
        loading={loading}
        paginator
        rows={rowsPerPage}
        totalRecords={totalRecords}
        lazy
        first={page * rowsPerPage}
        onPage={(e) => setPage(e.page)}
        selection={selectedArtworks}
        onSelectionChange={onSelectionChange}
        dataKey="id" // Ensure unique IDs for tracking selection
      >
        <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />
        <Column
          header={
            <span
              style={{
                cursor: "pointer",
              }}
              onClick={(e) => handleHeaderClick(e)}
            >
              ↓
            </span>
          }
          headerStyle={{ textAlign: "center" }}
          bodyStyle={{ textAlign: "center" }}
        />
        <Column field="title" header="Title" />
        <Column field="place_of_origin" header="Place of Origin" />
        <Column field="artist_display" header="Artist" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Start Date" />
        <Column field="date_end" header="End Date" />
      </DataTable>

      {/* OverlayPanel Input */}
      <OverlayPanel ref={op}>
        <div style={{ padding: "10px", width: "200px" }}>
          <input
            type="number"
            placeholder="Select rows..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={{
              width: "100%",
              padding: "5px",
              marginBottom: "10px",
              border: "1px solid #ccc",
              borderRadius: "3px",
            }}
          />
          <button
            onClick={handleSubmit}
            style={{
              padding: "5px 10px",
              border: "none",
              backgroundColor: "#007ad9",
              color: "#fff",
              borderRadius: "3px",
              cursor: "pointer",
            }}
          >
            Submit
          </button>
          {feedbackMessage && (
            <div style={{ marginTop: "10px", color: "#ff0000", fontSize: "0.9rem" }}>
              {feedbackMessage}
            </div>
          )}
        </div>
      </OverlayPanel>
    </div>
  );
};

export default ArtworkTable;

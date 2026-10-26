async function addColumn() {

    const name = prompt("New column name:");

    if (!name || !name.trim()) return;


    const column = name.trim();

    const defVal = prompt("Default value") || "";


    try {


        const response = await fetch("/add_column", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                column: column,
                default: defVal

            })

        });



        const result = await response.json();



        if (!result.success) {

            throw new Error(result.message || "Failed adding column");

        }



        // update frontend only after backend succeeds

        DATA.forEach(row => {

            row[column] = defVal;

        });


        renderTable(DATA);



        toast("Column added", "success");

        addLog(`Added column "${column}"`);



    } catch(err) {


        console.error("Add column error:", err);

        toast("Failed to save column", "error");


    }

}

async function dropSelectedColumn() {

    if (selectedColIdx == null) {

        toast("Select a column first", "error");
        return;

    }


    const col = Object.keys(DATA[0])[selectedColIdx];


    if (!confirm(`Drop "${col}"?`)) return;


    try {


        const response = await fetch("/drop_column", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                column: col

            })

        });



        const result = await response.json();



        if (!result.success) {

            throw new Error(result.message);

        }



        // update frontend after backend success

        DATA.forEach(row => {

            delete row[col];

        });


        renderTable(DATA);


        selectedColIdx = null;


        toast("Column dropped", "success");

        addLog(`Dropped ${col}`);



    } catch(err) {


        console.error(err);

        toast("Failed dropping column", "error");


    }

}

//rename
async function renameColumn() {


    if (selectedColIdx == null) {

        toast("Select a column first", "error");

        return;

    }



    const oldName = Object.keys(DATA[0])[selectedColIdx];


    const newName = prompt(
        "New name:",
        oldName
    );



    if (!newName || newName === oldName) return;



    try {


        const response = await fetch("/rename_column", {

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                old_name:oldName,

                new_name:newName.trim()

            })

        });



        const result = await response.json();



        if(!result.success){

            throw new Error(result.message);

        }



        DATA.forEach(row=>{

            row[newName] = row[oldName];

            delete row[oldName];

        });



        renderTable(DATA);



        toast(
            "Column renamed",
            "success"
        );


        addLog(
            `Renamed ${oldName} → ${newName}`
        );



    }catch(err){

        console.error(err);

        toast(
            "Rename failed",
            "error"
        );

    }

}
//add   roww
async function addRow() {


    try {


        const response = await fetch("/add_row", {

            method:"POST"

        });



        const result = await response.json();



        if(!result.success){

            throw new Error(result.message);

        }



        const row = {};



        Object.keys(DATA[0]).forEach(col=>{

            row[col] = "";

        });



        DATA.push(row);



        renderTable(DATA);



        toast(
            "Row added",
            "success"
        );


        addLog(
            "Added new row"
        );



    }catch(err){


        console.error(err);


        toast(
            "Failed adding row",
            "error"
        );


    }

}

async function normalizeColumn() {


    if(selectedColIdx == null){

        toast(
            "Select a column first",
            "error"
        );

        return;

    }



    const col = Object.keys(DATA[0])[selectedColIdx];



    try{


        await applyNormalize(col);



        toast(
            "Column normalized",
            "success"
        );


        addLog(
            `Normalized ${col}`
        );



    }catch(err){


        console.error(err);


        toast(
            "Normalization failed",
            "error"
        );


    }

}
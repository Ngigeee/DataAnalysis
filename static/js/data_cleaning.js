/* ═══════════════════════════════════════════════
   CLEANING
═══════════════════════════════════════════════ */

//helper
async function reloadActiveData() {

    try {
         // Make sure the dataset workspace is visible
        showDatasetWorkspace();
        
        const response = await fetch("/active_dataframe");

        const result = await response.json();

        DATA = result.data;

        renderTable(DATA, result.name);

        toast("Dataset reloaded", "success");

    } catch (err) {

        console.error(err);
        toast("Failed to reload dataset", "error");

    }

}
async function removeDuplicates() {

    try {
        // Make sure the dataset workspace is visible
        showDatasetWorkspace();
        
        const response = await fetch("/remove_duplicates", {
            method: "POST"
        });

        const result = await response.json();

        await reloadActiveData();

        toast(
            `Removed ${result.removed} duplicate row(s)`,
            result.removed ? "success" : "info"
        );

        addLog(
            `Removed ${result.removed} duplicate row(s). ${result.rows} rows remain.`
        );

    } catch (err) {

        console.error(err);
        toast("Failed to remove duplicates", "error");

    }

}

async function dropMissing() {

    try {
        // Make sure the dataset workspace is visible
        showDatasetWorkspace();
        

        const response = await fetch("/drop_missing", {
            method: "POST"
        });

        const result = await response.json();

        await reloadActiveData();

        toast(
            `Dropped ${result.removed} row(s) with missing values`,
            result.removed ? "success" : "info"
        );

        addLog(
            `Dropped ${result.removed} row(s) with missing values. ${result.rows} rows remain.`
        );

    } catch (err) {

        console.error(err);
        toast("Failed to drop missing values", "error");

    }

}

async function fillMissing(method){
    // Make sure the dataset workspace is visible
        showDatasetWorkspace();

    for(const c of cols()){

        const vals = DATA
            .map(r => parseFloat(r[c]))
            .filter(v => !isNaN(v));

        let fill;

        if(method === "mean"){
            fill = vals.length
                ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(4)
                : null;
        }

        else if(method === "median"){

            vals.sort((a,b)=>a-b);

            const mid = Math.floor(vals.length/2);

            fill = vals.length
                ? (vals.length % 2
                    ? vals[mid]
                    : ((vals[mid-1]+vals[mid])/2).toFixed(4))
                : null;
        }

        else if(method === "mode"){

            const freq = {};

            DATA.forEach(r=>{

                const v = r[c];

                if(v!=="" && v!=null){

                    freq[v]=(freq[v]||0)+1;

                }

            });

            fill = Object.keys(freq).length
                ? Object.keys(freq).reduce((a,b)=>freq[a]>freq[b]?a:b)
                : null;

        }

        if(fill != null){

            for(let rowIndex=0; rowIndex<DATA.length; rowIndex++){

                if(DATA[rowIndex][c]==="" || DATA[rowIndex][c]==null){

                    DATA[rowIndex][c]=fill;

                    await saveCell(rowIndex, c, fill);

                }

            }

        }

    }

    renderTable(DATA);

    toast(`Filled using ${method}`,"success");

}

async function applyNormalize(col) {

    const values = DATA.map(row => row[col]);

    const numericValues = values
        .map(v => parseFloat(v))
        .filter(v => !isNaN(v));


    if (numericValues.length === 0) {

        toast(
            "No numeric values found",
            "error"
        );

        return;

    }



    const min = Math.min(...numericValues);

    const max = Math.max(...numericValues);



    if (max === min) {

        toast(
            "Cannot normalize identical values",
            "error"
        );

        return;

    }



    const updates = [];



    DATA.forEach((row,index)=>{


        const value = parseFloat(row[col]);


        if(!isNaN(value)){


            const normalized =
                ((value - min) / (max - min))
                .toFixed(4);



            row[col] = normalized;



            updates.push({

                row:index,

                column:col,

                value:normalized

            });

        }


    });



    renderTable(DATA);



    // save every changed cell

    for(const update of updates){

        await saveCell(

            update.row,

            update.column,

            update.value

        );

    }



    addLog(
        `Normalized column "${col}"`
    );

}
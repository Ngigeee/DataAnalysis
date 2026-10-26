/* ═══════════════════════════════════════════════
   VISUALIZATION
═══════════════════════════════════════════════ */
function numCols(){ return cols().filter(c => DATA.map(r=>parseFloat(r[c])).filter(v=>!isNaN(v)).length > DATA.length*0.5); }
function catCols(){ return cols().filter(c => !numCols().includes(c)); }
function colSelect(label, id, optCols){ return `<div class="form-group"><label>${label}</label><select id="${id}">${optCols.map(c=>`<option>${esc(c)}</option>`).join('')}</select></div>`; }

function openViz(type){
  currentVizType = type;
  const el = document.getElementById('viz-overlay');
  const titleMap = {histogram:'Histogram', scatter:'Scatter Plot', bar:'Bar Chart'};
  document.getElementById('viz-title').innerHTML = `<i class="fas fa-chart-column" style="color:var(--accent)"></i> ${titleMap[type]}`;
  const form = document.getElementById('viz-form');
  if(type==='histogram') form.innerHTML = colSelect('Column (numeric)', 'v-col', numCols());
  else if(type==='scatter') form.innerHTML = colSelect('X Axis', 'v-x', numCols()) + colSelect('Y Axis', 'v-y', numCols());
  else if(type==='bar') form.innerHTML = colSelect('Category', 'v-cat', catCols()) + colSelect('Value', 'v-val', numCols());
  if(vizChartInstance){ vizChartInstance.destroy(); vizChartInstance=null; }
  document.getElementById('viz-canvas').getContext('2d').clearRect(0,0,9999,9999);
  el.classList.add('open');
}
function closeViz(){ document.getElementById('viz-overlay').classList.remove('open'); }

async function runViz(){

    const ctx = document
        .getElementById('viz-canvas')
        .getContext('2d');


    if(vizChartInstance){
        vizChartInstance.destroy();
        vizChartInstance = null;
    }


    const palette = [
        '#7c6af6',
        '#38bdf8',
        '#22c55e',
        '#f59e0b',
        '#ef4444',
        '#ec4899',
        '#a78bfa',
        '#34d399'
    ];


    let payload = {};


    // -----------------------------
    // Prepare request
    // -----------------------------

    if(currentVizType === "histogram"){

        payload = {

            type:"histogram",

            column:
            document.getElementById("v-col").value

        };


    }


    else if(currentVizType === "scatter"){

        payload = {

            type:"scatter",

            x:
            document.getElementById("v-x").value,

            y:
            document.getElementById("v-y").value

        };


    }


    else if(currentVizType === "bar"){

        payload = {

            type:"bar",

            category:
            document.getElementById("v-cat").value,

            value:
            document.getElementById("v-val").value

        };

    }



    try {


        const response = await fetch("/visualize",{

            method:"POST",

            headers:{

                "Content-Type":"application/json"

            },

            body:JSON.stringify(payload)

        });



        const result = await response.json();



        if(result.error){

            toast(result.error,"error");
            return;

        }



        // -----------------------------
        // Histogram
        // -----------------------------

        if(currentVizType === "histogram"){


            vizChartInstance = new Chart(ctx,{

                type:"bar",

                data:{

                    labels:result.labels,

                    datasets:[{

                        label:result.column,

                        data:result.data,

                        backgroundColor:
                        "rgba(124,106,246,.7)",

                        borderColor:
                        "#7c6af6",

                        borderWidth:1

                    }]

                },

                options:{

                    plugins:{

                        legend:{

                            labels:{

                                color:"#e2e8f0"

                            }

                        }

                    }

                }

            });


        }



        // -----------------------------
        // Scatter
        // -----------------------------

        else if(currentVizType === "scatter"){


            vizChartInstance = new Chart(ctx,{

                type:"scatter",

                data:{


                    datasets:[{

                        label:result.label,

                        data:result.points,

                        backgroundColor:
                        "rgba(56,189,248,.6)",

                        pointRadius:5

                    }]


                },


                options:{

                    plugins:{

                        legend:{

                            labels:{

                                color:"#e2e8f0"

                            }

                        }

                    },


                    scales:{

                        x:{

                            ticks:{

                                color:"#64748b"

                            }

                        },


                        y:{

                            ticks:{

                                color:"#64748b"

                            }

                        }

                    }

                }

            });


        }




        // -----------------------------
        // Bar chart
        // -----------------------------

        else if(currentVizType === "bar"){


            vizChartInstance = new Chart(ctx,{

                type:"bar",


                data:{


                    labels:result.labels,


                    datasets:[{


                        label:result.label,


                        data:result.data,


                        backgroundColor:
                        result.labels.map(
                            (_,i)=>
                            palette[i % palette.length] + "cc"
                        ),


                        borderColor:
                        result.labels.map(
                            (_,i)=>
                            palette[i % palette.length]
                        ),


                        borderWidth:1


                    }]

                },


                options:{


                    plugins:{


                        legend:{


                            labels:{


                                color:"#e2e8f0"


                            }


                        }


                    },


                    scales:{


                        x:{

                            ticks:{

                                color:"#64748b"

                            }

                        },


                        y:{

                            ticks:{

                                color:"#64748b"

                            }

                        }


                    }


                }


            });


        }



        addLog(`Generated ${currentVizType} chart`);



    }


    catch(error){


        console.error(error);

        toast(
            "Failed to generate visualization",
            "error"
        );


    }

}
//download chart  pdf  format
function downloadChartPDF(){


    if(!vizChartInstance){

        toast(
            "Generate a chart first",
            "error"
        );

        return;

    }



    const canvas = document.getElementById(
        "viz-canvas"
    );



    const image = canvas.toDataURL(
        "image/png",
        1.0
    );



    const { jsPDF } = window.jspdf;



    const pdf = new jsPDF({

        orientation:"landscape",

        unit:"px",

        format:[
            canvas.width,
            canvas.height
        ]

    });



    pdf.addImage(

        image,

        "PNG",

        0,

        0,

        canvas.width,

        canvas.height

    );



    pdf.save(
        `${currentVizType}_chart.pdf`
    );



    addLog(
        `Downloaded ${currentVizType} chart PDF`
    );


    toast(
        "PDF downloaded",
        "success"
    );

}
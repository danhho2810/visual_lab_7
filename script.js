const width = 640;
const height = 480;
                                         // CREATE SVG ELEMENTS //
//create svg elements using viewBox property
const svg = d3
    .select(".chart")
    .append("svg")
    .attr("viewBox", [0,0,width,height]);

                                            // LOAD DATA //
Promise.all([ // load multiple files
    d3.json('airports.json'),
    d3.json('world-110m.json')])
    .then(data=>{  // or use destructuring :([airports, wordmap])=>{ ... 

    let airports = data[0]; // data1.csv
    let wordmap = data[1]; // data2.json
    
    let visType = "force";
    const links = airports.links;
    const nodes = airports.nodes;

                                            // SUPPORT DRAGGING //
    let drag = force => {
        //restart the simulation when dragging starts
        function dragstart(d) {
            if (!d.active) force.alphaTarget(0.3).restart();
            d.subject.fx = d.subject.x;
            d.subject.fy = d.subject.y;
        }
        //fix the target node based on the current mouse position while dragging
        function dragging(d) {
            d.subject.fx = d.x;
            d.subject.fy = d.y;
        }
        //cool down the simulation and remove the fixation
        function dragend(d) {
            if (!d.active) force.alphaTarget(0);
            d.subject.fx = null;
            d.subject.fy = null;
        }
        
        return d3.drag()
            .on("start", dragstart)
            .on("drag", dragging)
            .on("end", dragend)
            .filter(event => visType === "force");
    }

                                            // CREATE A MAP //

    // Convert the TopoJSON to the GeoJSON format
    let geoMap = topojson.feature(wordmap, wordmap.objects.countries);

    // Create a projection
    let projection = d3.geoMercator().translate([width/2, height/2]);
    projection.fitExtent([[0,0], [width,height]], geoMap); //set the projection's scale and positions to fit the size of SVG

    //Create a path generator using the projection
    let path = d3
        .geoPath()
        .projection(projection);

    svg.append("path")
        .datum(geoMap)
        .attr("class", "map")
        .attr("d", path)
        .style("opacity", 0);
    
    //create force simulation
    let force = d3
        .forceSimulation(nodes)
        .force("link", d3.forceLink(links).distance(25))
        .force("charge", d3.forceManyBody().strength(-1))
        .force("center", d3.forceCenter().x(width/2).y(height/2))
        .on("tick", () => {link
            //update positions
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
            node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
        });

    
    //create nodes and links 
    let node = svg
        .append("g")
        .attr("class", "node")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", (d) => d.passengers/3000000)
        .attr("fill", "orange")
        .call(drag(force));
    let link = svg
        .append("g")
        .attr("stroke", "#999")
        .selectAll("line")
        .data(links)
        .join("line");

    // append title for tooltips
    node.append("title")
        .text(d=>d.name);

// Switch between layouts

    //Add an event listener for the buttons
    d3.selectAll(".radio")
        .on("change", event => {visType = event.target.value;
            switchLayout();})

    //Define switchLayout function
    function switchLayout(){
        if(visType=="map"){
            // stop the simulation
            force.stop();

            // set the positions of links and nodes based on geo-coordinates
            link.transition()
                .duration(650)
                .attr("x1", d => projection([d.source.longitude, d.source.latitude])[0])
                .attr("y1", d => projection([d.source.longitude, d.source.latitude])[1])
                .attr("x2", d => projection([d.target.longitude, d.target.latitude])[0])
                .attr("y2", d => projection([d.target.longitude, d.target.latitude])[1]);
                node.transition()
                .duration(600)
                .attr("cx", d => projection([d.longitude, d.latitude])[0])           
                .attr("cy", d => projection([d.longitude, d.latitude])[1]);
            
            // set the map opacity to 1
            svg.selectAll("path")
                .transition()
                .duration(500)
                .style("opacity", 1);
                
            node.on("mouseenter", (event, d) => {
                    const pos = d3.pointer(event, window);
                    d3.select("#tooltip")
                    .style('display', 'block')
                    .style('left', pos[0].toString()+'px')
                    .style("top", (pos[1]-80).toString()+'px')
                    .html(d.name.toString());
            
                    d3.select("#tooltip").classed("hidden", false)
                  })
                .on("mouseleave", () => d3.select("#tooltip").style('display', 'none'));
        }
        else{
            link 
                .transition()
                .duration(600)
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
            node
                .transition()
                .duration(600)
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);

            node.on("mouseenter", (event, d) => {
                const pos = d3.pointer(event, window);
                d3.select("#tooltip").style("opcity", 0)});
    
            // set the map opacity to 0
            svg.selectAll("path")
                .transition()
                .duration(500)
                .style("opacity", 0);
        }
    }
});
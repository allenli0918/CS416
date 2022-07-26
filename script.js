var margins = {
    top: 20,
    bottom: 80,
    left: 80,
    right: 30
}

var width = document.getElementById('visualization').clientWidth
var height = document.getElementById('visualization').clientHeight

var svg = d3.select('#visualization')
.append('svg')
.attr('width', width)
.attr('height', height)
.append('g')
.attr('transform', 'translate(' + margins.left + ',' + margins.top + ')')

svg.append("rect")
.attr("width", "100%")
.attr("height", "100%")
.attr("fill", "#fff3e6")

svg.append("text")
.attr("x", width / 2)             
.attr("y", 40)
.attr("text-anchor", "middle")  
.style("font-size", "24px") 
.style("text-decoration", "underline")  
.text("Most Significant US Economic Events by Year 2000-2012")

var t_width = width - margins.left - margins.right
var t_height = height - margins.top - margins.bottom

var x_scale = d3.scaleBand().rangeRound([0, t_width]).padding(0.1)
var y_scale = d3.scaleLinear().range([t_height, 0])

svg.append('g')
.attr('class', 'x axis')
.attr('transform', 'translate(0,' + t_height + ')')

svg.append('g')
.attr('class', 'y axis')

var date_parse = d3.timeParse('%Y %b')

function update(year) {
    d3.csv('GDP.csv', function(csv_data) {
        data = csv_data
        year_data = data.filter(function(d) { return date_parse(d.date).getFullYear() === +year })

        var t = d3.transition()
        .duration(1500)

        var quarters = year_data.map(function(d) { return d.date })
        x_scale.domain(quarters)

        var max_value = d3.max(year_data, function(d) { return d.value })
        
        var min_value = d3.min(year_data, function(d) { return d.value })

        y_scale.domain([min_value * 0.9, max_value * 1.1])

        var bars = svg.selectAll('.bar').data(year_data)

        bars.exit().remove()

        var tooltip = d3.select("#visualization")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "10px")
    
        var mouseover = function(d) {
            tooltip
            .html("Quarter: " + d.date + "<br>" + "GDP: " + d3.format(".1f")(d.value) + " blns" + "<br>" + "MoM Change: " +  d3.format(".2f")(d.mom_change * 100, 2) + "%" + "<br>" + "YoY Change: " + d3.format(".2f")(d.yoy_change * 100, 2) + "%")
            .style("opacity", 1)
        }
        var mousemove = function(d) {
            tooltip
            .style("left", (d3.mouse(this)[0]+90) + "px") 
            .style("top", (d3.mouse(this)[1]) + "px")
        }
        var mouseleave = function(d) {
            tooltip
            .style("opacity", 0)
        }             

        var new_bars = bars
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('height', 0)
        .attr('y', t_height)
        .attr('width', x_scale.bandwidth())
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)            

        new_bars.merge(bars)
        .transition(t)
        .attr('x', function(d) { return x_scale(d.date) })
        .attr('y', function(d) { return y_scale(d.value) })
        .attr('height', function(d) { return t_height - y_scale(d.value) })
        .attr('fill', function(d){ if (d.recession == 1) return "red" ; else return "#a3a3c2" })

        svg.select('.x.axis')
        .transition(t)
        .call(d3.axisBottom(x_scale))

        svg.select('.y.axis')
        .transition(t)
        .call(d3.axisLeft(y_scale))       

        // wrap function taken from stack overflow: https://stackoverflow.com/a/24785497/4115378 
        function wrap(text, t_width) {
            text.each(function () {
                var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1,
                    x = text.attr("x"),
                    y = text.attr("y"),
                    dy = 0,
                    tspan = text.text(null)
                                .append("tspan")
                                .attr("x", x)
                                .attr("y", y)
                                .attr("dy", dy + "em");
                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > t_width) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan")
                                    .attr("x", x)
                                    .attr("y", y)
                                    .attr("dy", ++lineNumber * lineHeight + dy + "em")
                                    .text(word);
                    }
                }
            });
        }            

        const annotations = [
            {
            note: {
                label: "Two periods of consecutive GDP decline. Q1 2009: -1.21% and Q2 2009: -0.34%",
                title: "Still in a Recession",
                wrap: 200, 
                padding: 10  
            },    
            color: ["white"],
            x: x_scale("2009 APR"),
            y: 550,
            dy: 30,
            dx: 30
            },
            {
            note: {
                label: "Two periods of consecutive GDP decline. Q4 2008: -1.95% and Q1 2009: -1.21%",
                title: "Recession",
                wrap: 200, 
                padding: 10,  
            },    
            color: ["white"],
            x: x_scale("2009 JAN"),
            y: 600,
            dy: 30,
            dx: 30
            },
            {
            note: {
                label: "Quarterly GDP change of +0.47% broke US out of technical recession territory",
                title: "Out of Recession",
                wrap: 200, 
                padding: 10,  
            },    
            color: ["white"],
            x: x_scale("2009 JUL"),
            y: 500,
            dy: 30,
            dx: 30
            }            
        ]

        const makeAnnotations = d3.annotation().annotations(annotations)

        if (year == 2009) { svg.append("g").attr("id", "recession").call(makeAnnotations) }
        else { svg.selectAll("#recession").remove() }

        if (year == 2000) {
            svg.selectAll("#narrative").remove()
            svg.append("text")
            .attr("x", 30)             
            .attr("y", 90)
            .attr("id", "narrative")
            .attr("font-family", "Saira")
            .style("font-size", "16px") 
            .text("This is a brief history of US economic output, known as Gross Domestic Product (GDP). Please scroll through the slider on the top left corner to see the biggest financial news of the year with the chart of quarterly GDP.")
            svg.append("text")
            .attr("x", 30)             
            .attr("y", 120)
            .attr("id", "narrative")
            .style("font-size", "16px") 
            .text("Year 2000: Bursting of the Dot.com Bubble - The internet was in style. Entrepreneurs saw potential in online business. However, online business was really in its infancy. Everyone was talking about a \"new economy\" which referred to an internet-driven economy. Most of the dot.com stocks, like Yahoo.com, were listed on the NASDAQ. In January 2000, the NASDAQ closed above 5000. 10 years later, the NASDAQ was trading around 2700. Investors were getting rich off unprofitable stocks with high prices and higher price/earnings ratios—firms like software companies and all things computer and internet. Cisco Systems, for example, traded at more than 150 times earnings in March of 2000. In April 2000, an inflation report caused the speculative bubble to burst and there were huge investment losses.")
            .call(wrap, 1800)}
        else if (year == 2001) {
            svg.selectAll("#narrative").remove()
            svg.append("text")
            .attr("x", 30)             
            .attr("y", 120)
            .attr("id", "narrative")
            .style("font-size", "16px") 
            .text("Year 2001: September 11 Terrorist Attacks - The 9/11 terrorist attacks helped shape other financial events of the decade. After that terrible day in September 2001, our economic climate was never to be the same again. It was only the third time in history that the New York Stock Exchange was shut down for a period of time. In this case, it was closed from September 10–17. Besides the tragic human loss of that day, the economic loss cannot be truly known. Some estimate that there were more than $40 billion in insurance losses alone. Approximately 18,000 small businesses were either displaced or destroyed in Lower Manhattan after the Twin Towers fell. The Department of Homeland Security was created. 9/11 caused a catastrophic financial loss for the U.S.")
            .call(wrap, 1800)
            svg.append("text")
            .attr("x", 30)             
            .attr("y", 180)
            .attr("id", "narrative")
            .style("font-size", "16px") 
            .text("Years 2001 and 2003–2022: War on Terror and Iraq War - After the 9/11 terrorist attacks, the War on Terror was launched in Afghanistan, and the Iraq War was launched in 2003. The cost of these wars is ongoing. By December 2020, it was estimated that U.S. taxpayers have paid more than $6.4 trillion to fund those operations overseas. This has been an incredible financial drain on our economy, and it is impossible to know what the final cost will be.")
            .call(wrap, 1800)}            
        else if (year == 2002) {
            svg.selectAll("#narrative").remove()
            svg.append("text")
            .attr("x", 30)             
            .attr("y", 120)
            .attr("id", "narrative")
            .style("font-size", "16px") 
            .text("Year 2002: Stock Market Crash - After a brief slide post 9/11, the stock market rallied but began to slide again in March 2002. The market reached lows not seen since 1997 and 1998 by July and September of 2002. The corporate fraud scandals, such as Enron, along with 9/11, were contributors to this loss of investor confidence in the ​stock market.")
            .call(wrap, 1800)}
        else if (year == 2003) {
            svg.selectAll("#narrative").remove()
            svg.append("text")
            .attr("x", 30)             
            .attr("y", 120)
            .attr("id", "narrative")
            .style("font-size", "16px") 
            .text("Years 2001 and 2003–2022: War on Terror and Iraq War - After the 9/11 terrorist attacks, the War on Terror was launched in Afghanistan, and the Iraq War was launched in 2003. The cost of these wars is ongoing. By December 2020, it was estimated that U.S. taxpayers have paid more than $6.4 trillion to fund those operations overseas. This has been an incredible financial drain on our economy, and it is impossible to know what the final cost will be.")
            .call(wrap, 1800)}
        else if (year == 2004) {
            svg.selectAll("#narrative").remove()
            svg.append("text")
            .attr("x", 30)             
            .attr("y", 120)
            .attr("id", "narrative")
            .style("font-size", "16px") 
            .text("Year 2004: China and India Grow as World Financial Powers - The rise of China and India as world financial powers is nothing short of amazing. China, alone, grew at an average rate of 9.8% during the previous two decades. Together, the two countries account for one-third of the world's population. Countries like the United States initially started outsourcing work to China and India because of cheap labor, but this is no longer the case. They kept their work in the two countries because they found talent—talent for innovation in high-tech fields. Millions of scientists and engineers are educated in India and China each year, compared to a much lower number in the U.S. The balance of power in technologies is likely to move West to East.")
            .call(wrap, 1800)}
        else if (year == 2005) {
            svg.selectAll("#narrative").remove()
            svg.append("text")
            .attr("x", 30)             
            .attr("y", 120)
            .attr("id", "narrative")
            .style("font-size", "16px") 
            .text("Year 2005: Hurricanes Katrina and Rita - On August 25, 2005, Hurricane Katrina hit the Gulf Coast of the U.S. as a strong Category 3 or low Category 4 storm. It quickly became the biggest natural disaster in U.S. history, almost destroying New Orleans entirely due to severe flooding. Hurricane Rita quickly followed Katrina, only making matters worse. Between the two, more than $175 billion in damage was done. More than 500,000 jobs were lost and more than homes were destroyed. Hundreds of thousands of people were displaced, and more than 1,800 were killed or missing. The effect on oil and gasoline prices was long-lasting.")
            .call(wrap, 1800)}
        else if (year == 2006) {
            svg.selectAll("#narrative").remove()
            svg.append("text")
            .attr("x", 30)             
            .attr("y", 120)
            .attr("id", "narrative")
            .style("font-size", "16px") 
            .text("Year 2006: US Slowdown - One word—slowdown—can define the U.S. economy this past year. Economic growth and job growth both fell in 2006 from previous years as the residential housing boom came to an end. The slowdown in employment growth and economic opportunity was home grown as consumers saw rising debt payments on the record debt built up in past years. This debt squeeze leaves less money available for key household expenditures and is already beginning to push many hardworking families over the edge amid rising loan defaults and bankruptcies. Yet at the same time, the federal government in 2006 continued to run large deficits—financed in large part by overseas investors—resulting in higher interest payments out of the U.S. Treasury. This outflow, in turn, exacerbated an already record high trade deficit fuelled by America’s large dependence on foreign oil and rising oil prices over most of the past year.")
            .call(wrap, 1800)}
        else if (year == 2007) {
            svg.selectAll("#narrative").remove()
            svg.append("text")
            .attr("x", 30)             
            .attr("y", 120)
            .attr("id", "narrative")
            .style("font-size", "16px") 
            .text("Years 2007 and 2008: Sub-Prime Housing Crisis and the Housing Bubble - In the early part of the 21st century, the U.S. housing market was booming. Housing values were high. Just about anyone who wanted to buy a home could buy a home. A phenomenon called sub-prime lending arose. Individuals and families who, in the past, could not have qualified for a mortgage, were able to qualify for adjustable-rate mortgages with low or no down payments and low initial interest rates. Banks made mortgage loans to these individuals for houses with inflated values. As the interest rates rose and their adjustable-rate loans got more expensive, they couldn't make their mortgage payments. Soon, large financial institutions were holding portfolios of loans that were worthless. The subprime mortgage crisis and the \"credit crunch\" ensued.")
            .call(wrap, 1800)}
        else if (year == 2008) {
            svg.selectAll("#narrative").remove()
            svg.append("text")
            .attr("x", 30)             
            .attr("y", 120)
            .attr("id", "narrative")
            .style("font-size", "16px") 
            .text("Years 2007 and 2008: Sub-Prime Housing Crisis and the Housing Bubble - In the early part of the 21st century, the U.S. housing market was booming. Housing values were high. Just about anyone who wanted to buy a home could buy a home. A phenomenon called sub-prime lending arose. Individuals and families who, in the past, could not have qualified for a mortgage, were able to qualify for adjustable-rate mortgages with low or no down payments and low initial interest rates. Banks made mortgage loans to these individuals for houses with inflated values. As the interest rates rose and their adjustable-rate loans got more expensive, they couldn't make their mortgage payments. Soon, large financial institutions were holding portfolios of loans that were worthless. The subprime mortgage crisis and the \"credit crunch\" ensued. ")
            .call(wrap, 1800)        
            svg.append("text")
            .attr("x", 30)             
            .attr("y", 190)
            .attr("id", "narrative")
            .style("font-size", "16px") 
            .text("Years 2008: Bernard Madoff, who owned his own investment advisory firm, was a former chairman of the NASDAQ. In 2008, he admitted to running a huge Ponzi scheme where he paid his investors with proceeds from the investments of other clients. Finally, it all unraveled and he could not meet his obligations. In one of the largest investment fraud schemes in Wall Street history, Madoff defrauded his investors of more than $50 billion. He was subsequently sentenced to 150 years in prison.")
            .call(wrap, 1800)}                    
        else if (year == 2009) {
            svg.selectAll("#narrative").remove()
            svg.append("text")
            .attr("x", 30)             
            .attr("y", 120)
            .attr("id", "narrative")
            .style("font-size", "16px") 
            .text("Years 2007–2009: The Global Recession and the Collapse of Wall Street - In September of 2008, a seemingly perfect storm of factors came together to precipitate the deepest economic downturn since the Great Depression. And it wasn't only in the U.S., but across the globe as well. The great investment banks that had stood on Wall Street began to collapse due to the sub-prime mortgage crisis and serious corporate fraud. During the last months of the Bush Administration, the federal government stepped in to bail out some of these institutions in order to keep the U.S. financial system afloat. By the time the Obama Administration reached the White House in January of 2009, the economy had contracted and the recession had taken hold. At the end of 2009, there were signs of recovery, but it didn't happen overnight.")
            .call(wrap, 1800)
            svg.append("text")
            .attr("x", 30)             
            .attr("y", 180)
            .attr("id", "narrative")
            .style("font-size", "16px") 
            .text("Years 2009-2015: Quantitative Easing - Things got so bad during the 2008 financial crisis that the Federal Reserve was forced to take unprecedented monetary policy measures to stimulate the economy. In addition to cutting its benchmark interest rate to essentially zero, the Fed also began a program of quantitative easing. From late 2008 through 2015, the Fed purchased trillions of dollars of government bonds and mortgage-backed securities, expanding its balance sheet from $800 billion to $4.5 trillion. The combination of low interest rates and quantitative easing made it extremely cheap for U.S. companies to borrow money to invest in growth.")
            .call(wrap, 1800)}            
        else if (year == 2010) {
            svg.selectAll("#narrative").remove()
            svg.append("text")
            .attr("x", 30)             
            .attr("y", 120)
            .attr("id", "narrative")
            .style("font-size", "16px") 
            .text("Years 2009-2015: Quantitative Easing - Things got so bad during the 2008 financial crisis that the Federal Reserve was forced to take unprecedented monetary policy measures to stimulate the economy. In addition to cutting its benchmark interest rate to essentially zero, the Fed also began a program of quantitative easing. From late 2008 through 2015, the Fed purchased trillions of dollars of government bonds and mortgage-backed securities, expanding its balance sheet from $800 billion to $4.5 trillion. The combination of low interest rates and quantitative easing made it extremely cheap for U.S. companies to borrow money to invest in growth.")
            .call(wrap, 1800)            
            svg.append("text")
            .attr("x", 30)             
            .attr("y", 180)
            .attr("id", "narrative")
            .style("font-size", "16px") 
            .text("Year 2010: Flash crash of 2010 - Unlike the market crash in 2007 and 2008, the flash crash of 2010 was over in a matter of minutes. On May 6, 2010, at about 2:32 p.m. ET, the Dow Jones Industrial Average dropped 998.5 points (about 9%) in roughly 36 minutes. The market quickly recovered most of its roughly $1 trillion in losses. Subsequent investigations found that illegal “spoof” trading was partially to blame for the crash. The crash prompted the creation of new market “circuit breakers” to temporarily halt trading in stocks that gain or lose 10% within five minutes.")
            .call(wrap, 1800)}
        else if (year == 2011) {
            svg.selectAll("#narrative").remove()
            svg.append("text")
            .attr("x", 30)             
            .attr("y", 120)
            .attr("id", "narrative")
            .style("font-size", "16px") 
            .text("Years 2009-2015: Quantitative Easing - Things got so bad during the 2008 financial crisis that the Federal Reserve was forced to take unprecedented monetary policy measures to stimulate the economy. In addition to cutting its benchmark interest rate to essentially zero, the Fed also began a program of quantitative easing. From late 2008 through 2015, the Fed purchased trillions of dollars of government bonds and mortgage-backed securities, expanding its balance sheet from $800 billion to $4.5 trillion. The combination of low interest rates and quantitative easing made it extremely cheap for U.S. companies to borrow money to invest in growth.")
            .call(wrap, 1800)            
            svg.append("text")
            .attr("x", 30)             
            .attr("y", 180)
            .attr("id", "narrative")
            .style("font-size", "16px") 
            .text("Year 2011: Debt ceiling crisis of 2011 - Up to 2011, the U.S. government had always raised the debt ceiling in a bipartisan manner so the country could continue to meet its financial obligations without interruption. However, this time the Republican-controlled House of Representatives demanded spending concessions from President Barack Obama before they would agree to raise the debt ceiling. Negotiations came down to the wire before a last-minute deal was reached. The stock market experienced extreme selling pressure prior to the deal, and credit-rating agency Standard & Poor’s even downgraded its U.S. credit rating for the first time in history, dropping it from AAA to AA+.")
            .call(wrap, 1800)}
        else if (year == 2012) {
            svg.selectAll("#narrative").remove()
            svg.append("text")
            .attr("x", 30)             
            .attr("y", 120)
            .attr("id", "narrative")
            .style("font-size", "16px") 
            .text("Years 2009-2015: Quantitative Easing - Things got so bad during the 2008 financial crisis that the Federal Reserve was forced to take unprecedented monetary policy measures to stimulate the economy. In addition to cutting its benchmark interest rate to essentially zero, the Fed also began a program of quantitative easing. From late 2008 through 2015, the Fed purchased trillions of dollars of government bonds and mortgage-backed securities, expanding its balance sheet from $800 billion to $4.5 trillion. The combination of low interest rates and quantitative easing made it extremely cheap for U.S. companies to borrow money to invest in growth.")
            .call(wrap, 1800)            
            svg.append("text")
            .attr("x", 30)             
            .attr("y", 180)
            .attr("id", "narrative")
            .style("font-size", "16px") 
            .text("Year 2012: Eurozone debt crisis - The Eurozone debt crisis also wreaked havoc with the U.S. stock market. Many people were not sure whether the European Central Bank, would prevent Greece, Spain, and Italy from defaulting on their debt. This uncertainty sent the Dow down 1,000 points in May.")
            .call(wrap, 1800)}        
        else if (year == 2013) {
            svg.selectAll("#narrative").remove()
            svg.append("text")
            .attr("x", 30)             
            .attr("y", 90)
            .attr("id", "narrative")
            .style("font-size", "24px") 
            .text("References: ")
            svg.append("text")
            .attr("x", 30)             
            .attr("y", 120)
            .attr("id", "narrative")
            .attr("fill", "blue")
            .style("font-size", "16px") 
            .text("1. top-10-financial-events-of-the-decade")
            .on('click', function () {window.open("https://www.thebalancesmb.com/top-10-financial-events-of-the-decade-393162")})
            svg.append("text")
            .attr("x", 30)             
            .attr("y", 140)
            .attr("id", "narrative")
            .attr("fill", "blue")
            .style("font-size", "16px") 
            .text("2. decades-biggest-events-on-wall-street")
            .on('click', function () {window.open("https://money.usnews.com/investing/stock-market-news/slideshows/decades-biggest-events-on-wall-street")})
            svg.append("text")
            .attr("x", 30)             
            .attr("y", 160)
            .attr("id", "narrative")
            .attr("fill", "blue")
            .style("font-size", "16px") 
            .text("3. the-us-economy-in-review-2006")
            .on('click', function () {window.open("https://americanprogress.org/article/the-u-s-economy-in-review-2006/#:~:text=Consumer%20debt%20soared%20to%20new,rose%20to%20highest%20on%20record.")})
            svg.append("text")
            .attr("x", 30)             
            .attr("y", 180)
            .attr("id", "narrative")
            .attr("fill", "blue")
            .style("font-size", "16px") 
            .text("4. us-economy-2012")
            .on('click', function () {window.open("https://www.thebalance.com/u-s-economy-2012-3305742#:~:text=At%20the%20end%20of%202012,budget%20deficit%20was%20%241.077%20trillion.")})                                    
        }          
        else {svg.selectAll("#narrative").remove()}
    })
}

var select = d3.select('#year')
select.on('change', function() {
    console.log(this.value)
    update(this.value)
})

update('2000')
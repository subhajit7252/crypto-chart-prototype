Chart.defaults.set('elements.line', {
    borderWidth: 2,
    borderColor: 'rgba(75, 192, 192, 1)', // The primary color of the line
    tension: 0.5, // This will make the line curvy, you can adjust or remove
    fill: false,
    shadowOffsetX: 0, // No horizontal offset
    shadowOffsetY: 4, // 4px vertical offset to imitate some depth
    shadowBlur: 50, // Blurring effect outside of the shadow
    shadowColor: 'rgba(75, 192, 192, 0.5)' // Semi-transparent shadow color similar to the line color
});

Chart.defaults.set('elements.bar', {
    backgroundColor: (context) => {
        // Add condition to decide color based on current and previous value
        const index = context.dataIndex;
        const current = context.dataset.data[index];
        const previous = index === 0 ? current : context.dataset.data[index - 1];
        return current > previous ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)';  // Adjust the alpha for transparency
    },
    borderColor: 'transparent', // No border color
    borderWidth: 0, // No border width

    // Add shadow settings here
    shadowOffsetX: 0,
    shadowOffsetY: 4,
    shadowBlur: 10,
    shadowColor: 'rgba(0, 0, 0, 0.5)'
});


const ctx = document.getElementById('crypto-chart').getContext('2d');
const currentDataDisplay = document.getElementById('currentData');

const upValue = (ctx, value) => ctx.p0.parsed.y < ctx.p1.parsed.y ? value : undefined;
const downValue = (ctx, value) => ctx.p0.parsed.y > ctx.p1.parsed.y ? value : undefined;

let data = {
    labels: [], // Your labels here.
    datasets: [{
        type: 'line', // This specifies a line chart.
        label: 'Price',
        borderColor: 'neon',
        data: [], // Your line data here.
        fill: false,
        segment: {
            borderColor: ctx => upValue(ctx, 'rgb(15,192,145)') || downValue(ctx, 'rgb(192,75,75)')           
        },
    },
    {
        type: 'bar', // This specifies a bar chart.
        label: 'Bar Data',
        backgroundColor: (context) => {
            const chartData = context.dataset.data;
            const value = chartData[context.dataIndex];
            if (context.dataIndex === 0) return 'rgba(75, 75, 75, 0.1)'; // Default grey for the first value.
            return value > chartData[context.dataIndex - 1] ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)';
        },
        data: [], // Your bar data here.
    }]
};

const minValue = Math.min(...data.datasets[1].data);  // Assuming your bar dataset is at index 1.
const maxValue = Math.max(...data.datasets[1].data);

let config = {
    type: 'bar',
    data: data,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
            },
            title: {
                display: true
            }
        },
        scales: {
            y: {             
                beginAtZero: false  // This ensures the y-axis doesn't start from zero.
            }
        }
    }
};

let cryptoChart = new Chart(ctx, config);


// function generateRandomData() {
//     const lastValue = data.datasets[0].data[data.datasets[0].data.length - 1];
//     const newValue = lastValue + Math.floor(Math.random() * 11) - 5;
    
//     const currentTime = new Date();
//     const newLabel = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}:${currentTime.getSeconds().toString().padStart(2, '0')}`;

//     const percentageChange = ((newValue - lastValue) / lastValue) * 100;
//     const textColor = newValue > lastValue ? 'green' : newValue < lastValue ? 'red' : 'grey';

//     document.getElementById('currentValue').textContent = newValue.toFixed(2);
//     document.getElementById('percentageChange').textContent = `(${percentageChange.toFixed(2)}%)`;
//     document.getElementById('currentData').style.color = textColor;

//     if (data.labels.length > 50) {
//         data.labels.shift();
//         data.datasets[0].data.shift();
//     }
//     data.labels.push(newLabel);
//     data.datasets[0].data.push(newValue); 
//     cryptoChart.update();
//     setTimeout(generateRandomData, Math.random() * 4000 + 1000);
// }

//setTimeout(generateRandomData, Math.random() * 4000 + 1000);

const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
let canUpdate = true;

ws.onmessage = (event) => {
    if (canUpdate) {
        canUpdate = false;
        setTimeout(() => canUpdate = true, 5000);       
        const dataRes = JSON.parse(event.data);
        price = parseFloat(dataRes.p).toFixed(2);
        const lastValue = data.datasets[0].data[data.datasets[0].data.length - 1];         
        const percentageChange = ((price - lastValue) / lastValue) * 100;
        const textColor = price > lastValue ? 'green' : price < lastValue ? 'red' : 'grey';
        document.getElementById('percentageChange').textContent = `(${percentageChange.toFixed(4)}%)`;
        document.getElementById('currentValue').textContent = price;
        document.getElementById('currentData').style.color = textColor;
    
         // Update Min and Max values
         const minPrice = Math.min(...data.datasets[0].data).toFixed(2);
         const maxPrice = Math.max(...data.datasets[0].data).toFixed(2);
         const minMaxElement = document.getElementById('minMaxValue');
         minMaxElement.innerHTML = `Min: ${minPrice} | Max: ${maxPrice}`;
         minMaxElement.style.fontSize = "0.5em";
         minMaxElement.style.color = "skyblue";
    
        const currentTime = new Date();
        const newLabel = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}:${currentTime.getSeconds().toString().padStart(2, '0')}`;
        
    
        if (!data.labels.length) { 
            data.labels.push(newLabel);
            data.datasets[0].data[0] = price; // updating the default value
        } else {
           
                if (data.labels.length > 20) {
                    data.labels.shift();
                    data.datasets[0].data.shift();
                    data.datasets[1].data.shift();

                }
                data.labels.push(newLabel);
                data.datasets[0].data.push(price);
                data.datasets[1].data.push(price);
            
        }    
        cryptoChart.update();
    }
};
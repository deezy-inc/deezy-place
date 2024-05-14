import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as bitcoin from 'bitcoinjs-lib';

const BtcTransactionTree = ({ txHex }) => {
    const svgRef = useRef(null);

    useEffect(() => {
        let tx;
        try {
            console.log('txHex:', txHex);
            tx = bitcoin.Psbt.fromHex(txHex, { network: bitcoin.networks.bitcoin }).extractTransaction();
        } catch (error) {
            console.error('Failed to parse transaction hex:', error);
            return;
        }

        if (!tx.ins || !tx.outs) {
            console.error('Transaction inputs or outputs are undefined');
            return;
        }

        const data = {
            name: 'Transaction',
            children: [
                {
                    name: 'Inputs',
                    children: tx.ins.map((input, index) => ({
                        name: `${Buffer.from(input.hash).reverse().toString('hex').slice(0, 4)}...:${input.index}`,
                        value: input.sequence, // Placeholder for value, replace with actual value if available
                    })),
                },
                {
                    name: 'Outputs',
                    children: tx.outs.map((output, index) => ({
                        name: output.script.toString('hex').slice(0, 4) + '...',
                        value: output.value,
                    })),
                },
            ],
        };

        const width = 800;
        const height = 600;
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };

        const svg = d3.select(svgRef.current)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        svg.selectAll('*').remove();

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const centerX = (width - margin.left - margin.right) / 2;
        const centerY = (height - margin.top - margin.bottom) / 2;

        // Create input nodes
        const inputNodes = data.children[0].children.map((d, i) => ({
            ...d,
            x: centerX - 200,
            y: centerY - (data.children[0].children.length / 2) * 30 + i * 30,
        }));

        // Create output nodes
        const outputNodes = data.children[1].children.map((d, i) => ({
            ...d,
            x: centerX + 200,
            y: centerY - (data.children[1].children.length / 2) * 30 + i * 30,
        }));

        // Create center node
        const centerNode = { name: data.name, x: centerX, y: centerY };

        // Draw links from inputs to center
        g.selectAll('.input-link')
            .data(inputNodes)
            .enter()
            .append('path')
            .attr('class', 'input-link')
            .attr('d', d => `M${d.x},${d.y}C${d.x + 100},${d.y} ${centerX - 100},${centerY} ${centerX},${centerY}`)
            .attr('fill', 'none')
            .attr('stroke', '#555');

        // Draw links from center to outputs
        g.selectAll('.output-link')
            .data(outputNodes)
            .enter()
            .append('path')
            .attr('class', 'output-link')
            .attr('d', d => `M${centerX},${centerY}C${centerX + 100},${centerY} ${d.x - 100},${d.y} ${d.x},${d.y}`)
            .attr('fill', 'none')
            .attr('stroke', '#555');

        // Draw input nodes
        g.selectAll('.input-node')
            .data(inputNodes)
            .enter()
            .append('circle')
            .attr('class', 'input-node')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', 5)
            .attr('fill', '#999')
            .on('mouseover', function (event, d) {
                d3.select(this).attr('r', 7);
                tooltip.transition().duration(200).style('opacity', .9);
                tooltip.html(`${d.name}<br/>${d.value ? `${d.value} sats` : ''}`)
                    .style('left', (event.pageX + 5) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function () {
                d3.select(this).attr('r', 5);
                tooltip.transition().duration(500).style('opacity', 0);
            });

        // Draw output nodes
        g.selectAll('.output-node')
            .data(outputNodes)
            .enter()
            .append('circle')
            .attr('class', 'output-node')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', 5)
            .attr('fill', '#999')
            .on('mouseover', function (event, d) {
                d3.select(this).attr('r', 7);
                tooltip.transition().duration(200).style('opacity', .9);
                tooltip.html(`${d.name}<br/>${d.value ? `${d.value} sats` : ''}`)
                    .style('left', (event.pageX + 5) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function () {
                d3.select(this).attr('r', 5);
                tooltip.transition().duration(500).style('opacity', 0);
            });

        // Draw center node
        g.append('circle')
            .attr('class', 'center-node')
            .attr('cx', centerNode.x)
            .attr('cy', centerNode.y)
            .attr('r', 10)
            .attr('fill', '#555');

        // Add labels for input nodes
        g.selectAll('.input-label')
            .data(inputNodes)
            .enter()
            .append('text')
            .attr('class', 'input-label btc-text-white')
            .attr('x', d => d.x - 10)
            .attr('y', d => d.y)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'end')
            .text(d => d.name + (d.value ? `: ${d.value} sats` : ''));

        // Add labels for output nodes
        g.selectAll('.output-label')
            .data(outputNodes)
            .enter()
            .append('text')
            .attr('class', 'output-label btc-text-white')
            .attr('x', d => d.x + 10)
            .attr('y', d => d.y)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'start')
            .text(d => d.name + (d.value ? `: ${d.value} sats` : ''));

        // Add label for center node
        g.append('text')
            .attr('class', 'center-label btc-text-white')
            .attr('x', centerNode.x)
            .attr('y', centerNode.y - 15)
            .attr('text-anchor', 'middle')
            .text(centerNode.name);

        // Tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);
    }, [txHex]);

    return <svg ref={svgRef}></svg>;
};

export default BtcTransactionTree;
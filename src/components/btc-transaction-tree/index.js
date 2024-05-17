import React, { useEffect, useRef, useState } from 'react';
import { TailSpin } from "react-loading-icons";
import * as d3 from 'd3';
import { toast } from "react-toastify";
import { parseHexPsbt } from './psbt';

const BtcTransactionTree = ({ hexPsbt, metadata, toggleBtcTreeReady }) => {
    const svgRef = useRef(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!hexPsbt || !metadata) return;

        const fetchData = () => {
            setLoading(true);
            toggleBtcTreeReady(false);
            const parsedData = parseHexPsbt(hexPsbt, metadata);
            setData(parsedData);
            setLoading(false);
        };

        fetchData();
    }, [hexPsbt, metadata]);

    useEffect(() => {
        if (!data) return;

        let width = 960;
        let height = 500;
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };

        const svg = d3.select(svgRef.current)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .style('cursor', 'move');

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

        // Tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.75)')
            .style('color', '#fff')
            .style('border-radius', '4px')
            .style('padding', '8px')
            .style('pointer-events', 'none')
            .style('font-size', '12px');

        const showTooltip = (event, d, content) => {
            tooltip.transition().duration(200).style('opacity', .9);
            tooltip.html(content)
                .style('left', (event.pageX + 5) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        };

        const onClick = (_, d) => {
            navigator.clipboard.writeText(d.fullName).then(() => {
                toast.success(`${d.fullName} copied to clipboard`);
            });
        };


        const hideTooltip = () => {
            tooltip.transition().duration(500).style('opacity', 0);
        };

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
            .style('cursor', 'pointer')
            .on('mouseover', function (event, d) {
                d3.select(this).attr('r', 7);
                showTooltip(event, d, `${d.type ? `${d.type}<br/>` : ''}${d.fullName}<br/>${d.inputValue ? `${d.inputValue} sats` : ''}`);
            })
            .on('mouseout', function () {
                d3.select(this).attr('r', 5);
                hideTooltip();
            })
            .on('click', onClick);

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
            .style('cursor', 'pointer')
            .on('mouseover', function (event, d) {
                d3.select(this).attr('r', 7);
                showTooltip(event, d, `${d.type ? `${d.type}<br/>` : ''}${d.value ? `${d.value} sats` : ''}<br/>${d.address ? d.address : ''}`);
            })
            .on('mouseout', function () {
                d3.select(this).attr('r', 5);
                hideTooltip();
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
            .text(d => d.name + (d.inputValue ? `: ${d.inputValue} sats` : ''))
            .style('cursor', 'pointer')
            .on('mouseover', function (event, d) {
                showTooltip(event, d, `${d.type ? `${d.type}<br/>` : ''}${d.fullName}<br/>${d.inputValue ? `${d.inputValue} sats` : ''}`);
            })
            .on('mouseout', hideTooltip)
            .on('click', onClick);

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
            .text(d => (d.value ? `${d.value} sats ${d.type === 'Fee' ? '(Fee)' : ''}` : ''))
            .style('cursor', 'pointer')
            .on('mouseover', function (event, d) {
                showTooltip(event, d, `${d.type ? `${d.type}<br/>` : ''}${d.value ? `${d.value} sats` : ''}<br/>${d.address ? d.address : ''}`);
            })
            .on('mouseout', hideTooltip);

        // Add label for center node
        g.append('text')
            .attr('class', 'center-label btc-text-white')
            .attr('x', centerNode.x)
            .attr('y', centerNode.y - 15)
            .attr('text-anchor', 'middle')
            .text(centerNode.name);

        const zoomBehavior = d3.zoom()
            .scaleExtent([0.5, 2])  // Limit zooming out to 0.5x and zooming in to 2x
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoomBehavior);

        const bounds = svg.node().getBBox();
        width = bounds.width + bounds.x + margin.right;
        height = bounds.height + bounds.y + margin.bottom;

        svg.attr('viewBox', `${bounds.x - margin.left} ${bounds.y - margin.top} ${width} ${height}`);

        toggleBtcTreeReady(true);

    }, [data]);

    return (
        <div style={{ width: '100%', height: '100%', overflowX: 'auto', overflowY: 'auto', position: 'relative' }}>
            {loading && <TailSpin stroke="#fec823" speed={0.75} />}
            <svg ref={svgRef}></svg>
        </div>
    );
};

export { BtcTransactionTree };
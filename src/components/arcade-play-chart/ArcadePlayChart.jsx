import { useEffect, useMemo, useRef, useState } from 'react'
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import * as d3 from 'd3'
import { db } from '../../services/firebase'
import './ArcadePlayChart.css'

const MAX_LOGS = 700
const TOP_GAMES = 9
const ANGLE_OFFSET = -Math.PI / 2

const normalizeGameName = (log) => {
  const fallback = 'Arcade Run'
  return (
    String(log.gameName || log.gameId || log.category || log.categoryKey || fallback)
      .trim() || fallback
  )
}

const timeButtons = [
  { id: 'all', label: 'All Time' },
  { id: '30d', label: '30 days' },
  { id: '7d', label: '7 days' },
  { id: '24h', label: '24 hours' },
]

const metricButtons = [
  { id: 'plays', label: 'Runs' },
  { id: 'avgScore', label: 'Avg Score' },
  { id: 'bestScore', label: 'Best Score' },
]

const chartTypeButtons = [
  { id: 'radar', label: 'Radar' },
  { id: 'chord', label: 'Chord' },
  { id: 'bars', label: 'Bars' },
  { id: 'stream', label: 'Streamgraph' },
]

const metricDefinitions = {
  plays: {
    label: 'Runs',
    accessor: (item) => item.plays,
    formatter: d3.format('d'),
  },
  avgScore: {
    label: 'Average',
    accessor: (item) => item.avgScore,
    formatter: d3.format('.0f'),
  },
  bestScore: {
    label: 'Best',
    accessor: (item) => item.bestScore,
    formatter: d3.format('.0f'),
  },
}

const getNumericScore = (log) => {
  if (typeof log.scoreValue === 'number') return log.scoreValue
  if (typeof log.score === 'number') return log.score
  return null
}

function ArcadePlayChart() {
  const [timeWindow, setTimeWindow] = useState('30d')
  const [metric, setMetric] = useState('plays')
  const [chartType, setChartType] = useState('radar')
  const [allLogs, setAllLogs] = useState([])
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [containerWidth, setContainerWidth] = useState(0)
  const [tooltip, setTooltip] = useState({
    isVisible: false,
    x: 0,
    y: 0,
    name: '',
    plays: 0,
    avgScore: 0,
    bestScore: 0,
    players: 0,
    metricValue: 0,
    metricLabel: 'Runs',
  })

  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const hoverTimeoutRef = useRef(null)

  useEffect(() => {
    let isMounted = true

    const loadLogs = async () => {
      setStatus('loading')
      setErrorMessage('')

      try {
        const logsRef = collection(db, 'arcade_logs')
        const constraints = [orderBy('createdAt', 'desc'), limit(MAX_LOGS)]

        if (timeWindow !== 'all') {
          const minutesByWindow = {
            '24h': 24 * 60,
            '7d': 7 * 24 * 60,
            '30d': 30 * 24 * 60,
          }
          const windowMinutes = minutesByWindow[timeWindow] || 30 * 24 * 60
          const cutoffDate = new Date(Date.now() - windowMinutes * 60 * 1000)
          constraints.unshift(where('createdAt', '>=', cutoffDate))
        }

        const logsQuery = query(logsRef, ...constraints)
        const snapshot = await getDocs(logsQuery)

        if (!isMounted) return

        const logs = snapshot.docs.map((doc) => doc.data())
        setAllLogs(logs)
        setStatus(logs.length ? 'success' : 'empty')
      } catch (error) {
        if (!isMounted) return

        if (error?.code === 'permission-denied') {
          setErrorMessage('Permission denied. Update Firestore read rules for arcade_logs.')
        } else {
          setErrorMessage('Could not load Arcade logs. Verify Firebase rules and connection.')
        }
        setStatus('error')
      }
    }

    loadLogs()

    return () => {
      isMounted = false
    }
  }, [timeWindow])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const observer = new ResizeObserver((entries) => {
      const latest = entries[entries.length - 1]
      if (!latest) return
      const width = Math.floor(latest.contentRect.width)
      if (width > 0) setContainerWidth(width)
    })

    observer.observe(container)
    setContainerWidth(Math.floor(container.getBoundingClientRect().width))

    return () => observer.disconnect()
  }, [status])

  const chartSeries = useMemo(() => {
    if (!allLogs.length) return []

    const metricConf = metricDefinitions[metric]

    const counters = {}
    allLogs.forEach((log) => {
      const name = normalizeGameName(log)
      if (!counters[name]) {
        counters[name] = {
          plays: 0,
          scoreSum: 0,
          scoreCount: 0,
          bestScore: 0,
          players: new Set(),
        }
      }

      counters[name].plays += 1
      counters[name].players.add(log.playerName || log.player || log.userId || 'Guest')

      const score = getNumericScore(log)
      if (typeof score === 'number' && Number.isFinite(score)) {
        counters[name].scoreSum += score
        counters[name].scoreCount += 1
        counters[name].bestScore = Math.max(counters[name].bestScore, score)
      }
    })

    const items = Object.entries(counters).map(([name, stats]) => ({
      name,
      plays: stats.plays,
      avgScore:
        stats.scoreCount > 0 ? Math.round((stats.scoreSum / stats.scoreCount) * 100) / 100 : 0,
      bestScore: Math.round(stats.bestScore * 100) / 100,
      players: stats.players.size,
    }))

    return items
      .map((item) => ({
        ...item,
        metricValue: metricConf.accessor(item),
      }))
      .sort((a, b) => b.metricValue - a.metricValue)
      .filter((item) => item.metricValue > 0)
      .slice(0, TOP_GAMES)
  }, [allLogs, metric])

  const heroMetrics = useMemo(() => {
    if (!allLogs.length) {
      return {
        logsCount: 0,
        totalPlayers: 0,
        totalGames: 0,
        topGame: 'No data',
      }
    }

    const players = new Set(allLogs.map((log) => log.playerName || log.player || log.userId || 'Guest'))
    const gameSet = new Set(allLogs.map((log) => normalizeGameName(log)))

    return {
      logsCount: allLogs.length,
      totalPlayers: players.size,
      totalGames: gameSet.size,
      topGame: chartSeries[0]?.name || 'No data',
    }
  }, [allLogs, chartSeries])

  useEffect(() => {
    if (status !== 'success' || !chartSeries.length || !svgRef.current || !containerWidth) {
      return
    }

    const width = Math.max(320, containerWidth)
    const height =
      chartType === 'stream' ? Math.max(260, Math.round(width * 0.58)) : Math.max(320, width * 0.78)

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')

    const metricConf = metricDefinitions[metric]
    const showTooltip = (event, node) => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
      const point = d3.pointer(event, containerRef.current)
      setTooltip({
        isVisible: true,
        x: point[0],
        y: point[1],
        name: node.name,
        plays: node.plays,
        avgScore: node.avgScore,
        bestScore: node.bestScore,
        players: node.players,
        metricValue: metricConf.formatter(node.metricValue),
        metricLabel: metricConf.label,
      })
    }

    const moveTooltip = (event) => {
      if (!containerRef.current) return
      const point = d3.pointer(event, containerRef.current)
      setTooltip((prev) => ({ ...prev, x: point[0], y: point[1] }))
    }

    const hideTooltip = () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = setTimeout(
        () => setTooltip((prev) => ({ ...prev, isVisible: false })),
        140,
      )
    }

    const renderRadar = () => {
      const centerX = width / 2
      const centerY = height / 2
      const outerRadius = Math.min(width, height) / 2 - 32
      const gridSteps = 5

      const maxValue = d3.max(chartSeries, (item) => item.metricValue) || 1
      const rScale = d3.scaleLinear().domain([0, maxValue]).range([0, outerRadius])
      const angleStep = (Math.PI * 2) / chartSeries.length

      const radar = svg
        .append('g')
        .attr('class', 'radar-chart')
        .attr('transform', `translate(${centerX}, ${centerY})`)

      for (let i = 1; i <= gridSteps; i += 1) {
        radar
          .append('circle')
          .attr('class', 'radar-grid')
          .attr('r', (outerRadius * i) / gridSteps)
      }

      const axes = radar
        .selectAll('.radar-axis')
        .data(chartSeries)
        .enter()
        .append('g')
        .attr('class', 'radar-axis')

      axes
        .append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', (_, index) => Math.cos(ANGLE_OFFSET + index * angleStep) * outerRadius)
        .attr('y2', (_, index) => Math.sin(ANGLE_OFFSET + index * angleStep) * outerRadius)

      const points = chartSeries.map((item, index) => ({
        ...item,
        angle: ANGLE_OFFSET + index * angleStep,
        radius: rScale(item.metricValue),
      }))

      const line = d3
        .lineRadial()
        .angle((d) => d.angle)
        .radius((d) => d.radius)
        .curve(d3.curveCatmullRomClosed)

      radar
        .append('path')
        .attr('class', 'radar-area')
        .attr('d', line(points))

      radar
        .append('path')
        .attr('class', 'radar-stroke')
        .attr('d', line(points))

      radar
        .selectAll('.radar-dot')
        .data(points)
        .enter()
        .append('circle')
        .attr('class', 'radar-dot')
        .attr('r', 5)
        .attr('cx', (node) => Math.cos(node.angle) * node.radius)
        .attr('cy', (node) => Math.sin(node.angle) * node.radius)
        .on('pointerenter', (event, node) => showTooltip(event, node))
        .on('pointermove', moveTooltip)
        .on('pointerleave', hideTooltip)

      radar
        .selectAll('.radar-label')
        .data(points)
        .enter()
        .append('text')
        .attr('class', 'radar-label')
        .attr('x', (node) => Math.cos(node.angle) * (outerRadius + 16))
        .attr('y', (node) => Math.sin(node.angle) * (outerRadius + 16))
        .attr('text-anchor', (node) => (Math.cos(node.angle) >= 0 ? 'start' : 'end'))
        .text((node) =>
          node.name.length > 14 ? `${node.name.slice(0, 13)}...` : node.name,
        )
    }

    const renderBars = () => {
      const margin = { top: 24, right: 18, bottom: 50, left: 48 }
      const innerWidth = width - margin.left - margin.right
      const innerHeight = height - margin.top - margin.bottom

      const xScale = d3
        .scaleBand()
        .domain(chartSeries.map((item) => item.name))
        .range([0, innerWidth])
        .padding(0.25)

      const maxValue = d3.max(chartSeries, (item) => item.metricValue) || 1
      const yScale = d3.scaleLinear().domain([0, maxValue]).nice().range([innerHeight, 0])

      const barGroup = svg
        .append('g')
        .attr('class', 'bars-chart')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)

      barGroup
        .append('g')
        .attr('class', 'bars-grid')
        .call(d3.axisLeft(yScale).ticks(4).tickSize(-innerWidth).tickFormat(''))

      barGroup
        .append('g')
        .attr('class', 'bars-axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).tickSize(0))
        .selectAll('text')
        .attr('transform', 'translate(0,6) rotate(-10)')
        .style('text-anchor', 'end')

      barGroup
        .append('g')
        .attr('class', 'bars-axis')
        .call(d3.axisLeft(yScale).ticks(4))

      barGroup
        .selectAll('.bar-rect')
        .data(chartSeries)
        .enter()
        .append('rect')
        .attr('class', 'bar-rect')
        .attr('x', (node) => xScale(node.name))
        .attr('y', innerHeight)
        .attr('width', xScale.bandwidth())
        .attr('height', 0)
        .on('pointerenter', (event, node) => showTooltip(event, node))
        .on('pointermove', moveTooltip)
        .on('pointerleave', hideTooltip)
        .transition()
        .duration(700)
        .ease(d3.easeCubicOut)
        .attr('y', (node) => yScale(node.metricValue))
        .attr('height', (node) => innerHeight - yScale(node.metricValue))
    }

    const renderChord = () => {
      const games = chartSeries.slice(0, Math.min(6, chartSeries.length))
      const indexByGame = new Map(games.map((game, index) => [game.name, index]))
      const matrix = Array.from({ length: games.length }, () =>
        Array.from({ length: games.length }, () => 0),
      )

      const playerStats = {}
      allLogs.forEach((log) => {
        const name = normalizeGameName(log)
        if (!indexByGame.has(name)) return
        const player = log.playerName || log.player || log.userId || 'Guest'
        if (!playerStats[player]) playerStats[player] = {}
        playerStats[player][name] = (playerStats[player][name] || 0) + 1
      })

      Object.values(playerStats).forEach((counts) => {
        games.forEach((gameA, i) => {
          games.forEach((gameB, j) => {
            const a = counts[gameA.name] || 0
            const b = counts[gameB.name] || 0
            matrix[i][j] += Math.min(a, b)
          })
        })
      })

      if (matrix.flat().every((value) => value === 0)) {
        games.forEach((game, index) => {
          matrix[index][index] = Math.max(1, Math.round(game.metricValue))
        })
      }

      const outerRadius = Math.min(width, height) / 2 - 28
      const innerRadius = outerRadius * 0.72
      const chord = d3.chord().padAngle(0.08).sortSubgroups(d3.descending)(matrix)
      const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius)
      const ribbon = d3.ribbon().radius(innerRadius)
      const color = d3.scaleSequential(d3.interpolatePlasma).domain([0, games.length - 1])

      const chordGroup = svg
        .append('g')
        .attr('class', 'chord-chart')
        .attr('transform', `translate(${width / 2}, ${height / 2})`)

      chordGroup
        .selectAll('.chord-ribbon')
        .data(chord)
        .enter()
        .append('path')
        .attr('class', 'chord-ribbon')
        .attr('d', ribbon)
        .attr('fill', (d) => color(d.source.index))
        .attr('opacity', 0.35)

      const groups = chordGroup
        .selectAll('.chord-group')
        .data(chord.groups)
        .enter()
        .append('g')
        .attr('class', 'chord-group')

      groups
        .append('path')
        .attr('class', 'chord-arc')
        .attr('d', arc)
        .attr('fill', (d) => color(d.index))
        .attr('stroke', '#ffe86f')
        .attr('stroke-width', 1.5)
        .on('pointerenter', (event, group) => showTooltip(event, games[group.index]))
        .on('pointermove', moveTooltip)
        .on('pointerleave', hideTooltip)

      groups
        .append('text')
        .attr('class', 'chord-label')
        .attr('dy', '0.35em')
        .attr('transform', (d) => {
          const angle = (d.startAngle + d.endAngle) / 2
          const rotate = (angle * 180) / Math.PI - 90
          const flip = angle > Math.PI ? 180 : 0
          return `rotate(${rotate}) translate(${outerRadius + 14}) rotate(${flip})`
        })
        .attr('text-anchor', (d) => ((d.startAngle + d.endAngle) / 2 > Math.PI ? 'end' : 'start'))
        .text((d) => {
          const name = games[d.index].name
          return name.length > 12 ? `${name.slice(0, 11)}...` : name
        })
    }

    const renderStream = () => {
      const margin = { top: 18, right: 22, bottom: 38, left: 38 }
      const innerWidth = width - margin.left - margin.right
      const innerHeight = height - margin.top - margin.bottom
      const gameKeys = chartSeries.map((item) => item.name)

      const logDates = allLogs
        .map((log) => {
          const rawDate = log.createdAt || log.timestamp
          if (rawDate?.toDate) return rawDate.toDate()
          if (rawDate instanceof Date) return rawDate
          if (typeof rawDate === 'number') return new Date(rawDate)
          if (typeof rawDate === 'string') return new Date(rawDate)
          return null
        })
        .filter((date) => date instanceof Date && !Number.isNaN(date.getTime()))

      if (!logDates.length) return

      const dateFloor = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dateSet = new Set(logDates.map((date) => dateFloor(date).getTime()))
      const dates = Array.from(dateSet)
        .sort((a, b) => a - b)
        .map((timestamp) => new Date(timestamp))

      const dataByDate = new Map(dates.map((date) => [date.getTime(), { date }]))

      allLogs.forEach((log) => {
        const name = normalizeGameName(log)
        if (!gameKeys.includes(name)) return
        const rawDate = log.createdAt || log.timestamp
        const date =
          rawDate?.toDate?.() || (rawDate instanceof Date ? rawDate : new Date(rawDate))
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) return
        const dayKey = dateFloor(date).getTime()
        const entry = dataByDate.get(dayKey)
        if (!entry) return
        entry[name] = (entry[name] || 0) + 1
      })

      const stackedData = dates.map((date) => {
        const row = dataByDate.get(date.getTime()) || { date }
        const base = { date }
        gameKeys.forEach((key) => {
          base[key] = row[key] || 0
        })
        return base
      })

      const stack = d3
        .stack()
        .keys(gameKeys)
        .offset(d3.stackOffsetWiggle)

      const layers = stack(stackedData)
      const xScale = d3.scaleTime().domain(d3.extent(dates)).range([0, innerWidth])
      const yExtent = d3.extent(layers.flat(2))
      const yScale = d3
        .scaleLinear()
        .domain([yExtent[0] || -1, yExtent[1] || 1])
        .range([innerHeight, 0])

      const area = d3
        .area()
        .x((d) => xScale(d.data.date))
        .y0((d) => yScale(d[0]))
        .y1((d) => yScale(d[1]))
        .curve(d3.curveCatmullRom)

      const streamGroup = svg
        .append('g')
        .attr('class', 'stream-chart')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)

      streamGroup
        .append('g')
        .attr('class', 'stream-axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).ticks(4).tickSize(0))

      streamGroup
        .append('g')
        .attr('class', 'stream-axis')
        .call(d3.axisLeft(yScale).ticks(4))

      const color = d3.scaleSequential(d3.interpolatePlasma).domain([0, gameKeys.length - 1])

      streamGroup
        .selectAll('.stream-layer')
        .data(layers)
        .enter()
        .append('path')
        .attr('class', 'stream-layer')
        .attr('d', area)
        .attr('fill', (_, index) => color(index))
        .attr('opacity', 0.7)
    }

    if (chartType === 'radar') renderRadar()
    if (chartType === 'chord') renderChord()
    if (chartType === 'bars') renderBars()
    if (chartType === 'stream') renderStream()
  }, [status, chartSeries, containerWidth, metric, chartType, allLogs])

  return (
    <section className="arcade-play-chart-card">
      <div className="arcade-play-headline">
        <h3>Arcade Orbit Array</h3>
        <p>Neon orbits reveal which cabinets dominate the current focus metric.</p>
      </div>

      <div className="arcade-play-metrics">
        <article className="arcade-play-metric">
          <span className="arcade-play-metric-label">Runs in window</span>
          <strong>{heroMetrics.logsCount}</strong>
        </article>
        <article className="arcade-play-metric">
          <span className="arcade-play-metric-label">Active players</span>
          <strong>{heroMetrics.totalPlayers}</strong>
        </article>
        <article className="arcade-play-metric">
          <span className="arcade-play-metric-label">Cabinets tracked</span>
          <strong>{heroMetrics.totalGames}</strong>
        </article>
        <article className="arcade-play-metric">
          <span className="arcade-play-metric-label">Top game</span>
          <strong>{heroMetrics.topGame}</strong>
        </article>
      </div>

      <div className="arcade-play-controls" role="group" aria-label="Arcade chart controls">
        <div className="arcade-play-chip-group">
          {timeButtons.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`arcade-play-chip ${timeWindow === item.id ? 'is-active' : ''}`}
              onClick={() => setTimeWindow(item.id)}
              aria-pressed={timeWindow === item.id}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="arcade-play-chip-group">
          {metricButtons.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`arcade-play-chip ${metric === item.id ? 'is-active' : ''}`}
              onClick={() => setMetric(item.id)}
              aria-pressed={metric === item.id}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="arcade-play-chip-row">
          <span className="arcade-play-chip-label">Chart Style</span>
          <div className="arcade-play-chip-group">
            {chartTypeButtons.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`arcade-play-chip ${chartType === item.id ? 'is-active' : ''}`}
                onClick={() => setChartType(item.id)}
                aria-pressed={chartType === item.id}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="arcade-play-chart">
        {status === 'loading' && (
          <p className="arcade-play-status">Loading most played games from logs...</p>
        )}
        {status === 'error' && <p className="arcade-play-status is-error">{errorMessage}</p>}
        {status === 'empty' && <p className="arcade-play-status">No arcade runs available yet.</p>}
        {status === 'success' && !chartSeries.length && (
          <p className="arcade-play-status">No play counts to display yet.</p>
        )}

        {status === 'success' ? (
          <div className="arcade-play-chart-frame" ref={containerRef}>
            <div
              className={`arcade-play-tooltip ${tooltip.isVisible ? 'is-visible' : ''}`}
              style={{
                left: `${tooltip.x + 14}px`,
                top: `${tooltip.y - 14}px`,
                display: tooltip.isVisible ? 'block' : 'none',
              }}
            >
              <span>{tooltip.name}</span>
              <strong>Runs:</strong> {tooltip.plays}
              <br />
              <strong>Players:</strong> {tooltip.players}
              <br />
              <strong>{tooltip.metricLabel}:</strong> {tooltip.metricValue}
              <br />
              <strong>Avg:</strong> {tooltip.avgScore}
              <br />
              <strong>Best:</strong> {tooltip.bestScore}
            </div>
            <svg ref={svgRef} />
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default ArcadePlayChart

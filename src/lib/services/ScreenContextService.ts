export interface ScreenContextData {
  route: string
  pageName: string
  visibleData: any
  activeElements: string[]
  domElements: {
    headings: string[]
    buttons: string[]
    inputs: string[]
    tables: Array<{
      headers: string[]
      rowCount: number
    }>
    charts: string[]
    cards: Array<{
      title: string
      content: string
    }>
  }
  pageState: {
    selectedItems: string[]
    activeFilters: Record<string, any>
    currentTab: string
    pagination: {
      page: number
      total: number
    }
  }
}

export class ScreenContextService {
  private static instance: ScreenContextService
  private currentContext: ScreenContextData | null = null
  private observers: Array<(context: ScreenContextData) => void> = []

  static getInstance(): ScreenContextService {
    if (!ScreenContextService.instance) {
      ScreenContextService.instance = new ScreenContextService()
    }
    return ScreenContextService.instance
  }

  // Capture current screen context
  captureContext(): ScreenContextData {
    const context: ScreenContextData = {
      route: window.location.pathname,
      pageName: this.getPageName(),
      visibleData: this.extractVisibleData(),
      activeElements: this.getActiveElements(),
      domElements: this.extractDOMElements(),
      pageState: this.extractPageState()
    }

    this.currentContext = context
    this.notifyObservers(context)
    return context
  }

  // Get current context without re-capturing
  getCurrentContext(): ScreenContextData | null {
    return this.currentContext
  }

  // Subscribe to context changes
  subscribe(callback: (context: ScreenContextData) => void): () => void {
    this.observers.push(callback)
    return () => {
      this.observers = this.observers.filter(obs => obs !== callback)
    }
  }

  // Auto-capture context on relevant DOM changes
  startAutoCapture(): void {
    // Capture on route changes
    let currentPath = window.location.pathname
    const checkRoute = () => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname
        setTimeout(() => this.captureContext(), 100) // Small delay for DOM to update
      }
    }
    
    // Use MutationObserver for DOM changes
    const observer = new MutationObserver((mutations) => {
      const relevantChanges = mutations.some(mutation => {
        if (mutation.type === 'childList') {
          return mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0
        }
        if (mutation.type === 'attributes') {
          return ['class', 'data-state', 'aria-selected'].includes(mutation.attributeName || '')
        }
        return false
      })

      if (relevantChanges) {
        // Debounce rapid changes
        clearTimeout((this as any).captureTimeout)
        ;(this as any).captureTimeout = setTimeout(() => {
          this.captureContext()
        }, 500)
      }
    })

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-state', 'aria-selected']
    })

    // Check route changes periodically
    setInterval(checkRoute, 1000)

    // Initial capture
    setTimeout(() => this.captureContext(), 1000)
  }

  private getPageName(): string {
    // Try to get page name from title, breadcrumbs, or route
    const title = document.title
    const breadcrumb = document.querySelector('[data-testid="breadcrumb"], .breadcrumb')?.textContent
    const mainHeading = document.querySelector('h1, h2')?.textContent
    
    return mainHeading || breadcrumb || title || 'Unknown Page'
  }

  private extractVisibleData(): any {
    const data: any = {}
    const route = window.location.pathname

    // Special handling for Operations Center proof-of-concept dashboard
    if (route.includes('/admin/operations-center')) {
      data.operationsCenter = this.extractOperationsCenterData()
    }

    // Extract data from tables
    const tables = document.querySelectorAll('table')
    if (tables.length > 0) {
      data.tables = Array.from(tables).map((table, index) => {
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim())
        const rows = Array.from(table.querySelectorAll('tbody tr')).slice(0, 5) // First 5 rows
        return {
          index,
          headers,
          sampleRows: rows.map(row => 
            Array.from(row.querySelectorAll('td')).map(td => td.textContent?.trim())
          )
        }
      })
    }

    // Enhanced metrics extraction for all cards/metrics
    const cards = document.querySelectorAll('[data-testid*="card"], .card, [class*="card"], div[style*="background"]')
    if (cards.length > 0) {
      data.cards = Array.from(cards).slice(0, 20).map((card, index) => {
        const title = card.querySelector('h1, h2, h3, h4, h5, h6, [class*="title"]')?.textContent?.trim()
        const value = card.querySelector('[class*="value"], [class*="metric"], [class*="number"]')?.textContent?.trim()
        const description = card.querySelector('p, [class*="description"], div[style*="color"]')?.textContent?.trim()
        
        // Extract numerical values and percentages
        const text = card.textContent || ''
        const numbers = text.match(/\d+(?:[.,]\d+)*%?/g) || []
        const hasGreenIndicator = card.innerHTML.includes('#00ff00') || card.innerHTML.includes('green')
        const hasCheckmark = text.includes('✅') || text.includes('TARGET ACHIEVED') || text.includes('SUCCESS')
        
        return {
          index,
          title,
          value,
          description,
          numbers,
          status: hasGreenIndicator ? 'success' : hasCheckmark ? 'achieved' : 'normal',
          fullText: text.slice(0, 200)
        }
      }).filter(card => card.title || card.value || card.numbers.length > 0)
    }

    // Extract metrics and KPIs specifically
    data.metrics = this.extractMetrics()

    // Extract proof-of-concept evidence
    data.proofOfConcept = this.extractProofOfConceptData()

    // Extract form data
    const forms = document.querySelectorAll('form')
    if (forms.length > 0) {
      data.forms = Array.from(forms).map(form => {
        const inputs = Array.from(form.querySelectorAll('input, select, textarea')).map(input => ({
          name: input.getAttribute('name'),
          type: input.getAttribute('type'),
          value: (input as HTMLInputElement).value,
          placeholder: input.getAttribute('placeholder')
        }))
        return { inputs }
      })
    }

    return data
  }

  private extractOperationsCenterData(): any {
    const opsData: any = {}

    // Extract current mode/view
    const activeButton = document.querySelector('button.btn-primary')?.textContent?.trim()
    if (activeButton) {
      opsData.currentView = activeButton
    }

    // Extract proof-of-concept metrics if visible
    const pocSection = document.querySelector('[class*="proof-of-concept"]')
    if (pocSection) {
      opsData.proofOfConceptVisible = true
      opsData.pocMetrics = this.extractProofOfConceptMetrics(pocSection)
    }

    // Extract module status
    const moduleItems = document.querySelectorAll('[class*="module-item"]')
    if (moduleItems.length > 0) {
      opsData.modules = Array.from(moduleItems).map(item => ({
        name: item.querySelector('[class*="module-name"]')?.textContent?.trim(),
        status: item.querySelector('[class*="module-dot"]')?.style?.background || 'unknown',
        stat: item.querySelector('[class*="module-stat"]')?.textContent?.trim()
      }))
    }

    return opsData
  }

  private extractMetrics(): any {
    const metrics: any = {}

    // Look for percentage values
    const percentages = Array.from(document.querySelectorAll('*')).filter(el => {
      const text = el.textContent || ''
      return text.match(/\d+(?:\.\d+)?%/) && el.children.length === 0
    }).map(el => ({
      value: el.textContent?.trim(),
      context: el.parentElement?.textContent?.slice(0, 100)
    }))

    if (percentages.length > 0) {
      metrics.percentages = percentages.slice(0, 10)
    }

    // Look for large numbers (like video counts)
    const largeNumbers = Array.from(document.querySelectorAll('*')).filter(el => {
      const text = el.textContent || ''
      return text.match(/\d{3,}/) && el.children.length === 0
    }).map(el => ({
      value: el.textContent?.trim(),
      context: el.parentElement?.textContent?.slice(0, 100)
    }))

    if (largeNumbers.length > 0) {
      metrics.largeNumbers = largeNumbers.slice(0, 10)
    }

    return metrics
  }

  private extractProofOfConceptData(): any {
    const pocData: any = {}

    // Look for proof-of-concept specific indicators
    const targetAchieved = document.body.textContent?.includes('TARGET ACHIEVED')
    const targetExceeded = document.body.textContent?.includes('TARGET EXCEEDED')
    const allObjectives = document.body.textContent?.includes('ALL OBJECTIVES ACHIEVED')

    pocData.indicators = {
      targetAchieved,
      targetExceeded,
      allObjectives
    }

    // Extract specific proof metrics
    const proofMetrics = []
    const text = document.body.textContent || ''
    
    // Look for accuracy metrics
    const accuracyMatch = text.match(/(\d+\.?\d*)%.*accuracy/gi)
    if (accuracyMatch) {
      proofMetrics.push({ type: 'accuracy', values: accuracyMatch })
    }

    // Look for video processing numbers
    const videoMatch = text.match(/(\d{3,}).*videos/gi)
    if (videoMatch) {
      proofMetrics.push({ type: 'videos', values: videoMatch })
    }

    // Look for framework counts
    const frameworkMatch = text.match(/(\d+).*frameworks/gi)
    if (frameworkMatch) {
      proofMetrics.push({ type: 'frameworks', values: frameworkMatch })
    }

    pocData.metrics = proofMetrics

    return pocData
  }

  private extractProofOfConceptMetrics(pocSection: Element): any {
    const metrics: any = {}

    // Extract all visible metrics from the proof-of-concept section
    const metricCards = pocSection.querySelectorAll('div[style*="background"]')
    metrics.cards = Array.from(metricCards).map(card => ({
      title: card.querySelector('h4')?.textContent?.trim(),
      value: card.querySelector('div[style*="font-size: 24px"]')?.textContent?.trim(),
      description: card.querySelector('div[style*="color: rgba"]')?.textContent?.trim(),
      status: card.innerHTML.includes('#00ff00') ? 'success' : 'normal'
    }))

    return metrics
  }

  private getActiveElements(): string[] {
    const active: string[] = []

    // Active tabs
    const activeTabs = document.querySelectorAll('[role="tab"][aria-selected="true"], .tab-active, [data-state="active"]')
    activeTabs.forEach(tab => {
      const text = tab.textContent?.trim()
      if (text) active.push(`Active Tab: ${text}`)
    })

    // Selected items
    const selected = document.querySelectorAll('[aria-selected="true"], .selected, [data-selected="true"]')
    selected.forEach(item => {
      const text = item.textContent?.trim()
      if (text && !active.some(a => a.includes(text))) {
        active.push(`Selected: ${text}`)
      }
    })

    // Focused elements
    if (document.activeElement && document.activeElement !== document.body) {
      const focused = document.activeElement.textContent?.trim() || 
                     document.activeElement.getAttribute('placeholder') ||
                     document.activeElement.tagName
      if (focused) active.push(`Focused: ${focused}`)
    }

    return active
  }

  private extractDOMElements(): ScreenContextData['domElements'] {
    return {
      headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map(h => h.textContent?.trim())
        .filter(Boolean)
        .slice(0, 10),
      
      buttons: Array.from(document.querySelectorAll('button'))
        .map(b => b.textContent?.trim() || b.getAttribute('aria-label'))
        .filter(Boolean)
        .slice(0, 20),
      
      inputs: Array.from(document.querySelectorAll('input, textarea'))
        .map(i => i.getAttribute('placeholder') || i.getAttribute('name'))
        .filter(Boolean)
        .slice(0, 10),
      
      tables: Array.from(document.querySelectorAll('table')).map(table => ({
        headers: Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim()).filter(Boolean),
        rowCount: table.querySelectorAll('tbody tr').length
      })),
      
      charts: Array.from(document.querySelectorAll('[class*="chart"], [data-testid*="chart"], svg'))
        .map(chart => chart.getAttribute('aria-label') || chart.className)
        .filter(Boolean)
        .slice(0, 5),
      
      cards: Array.from(document.querySelectorAll('[class*="card"], [data-testid*="card"]'))
        .map(card => ({
          title: card.querySelector('h1, h2, h3, h4, h5, h6')?.textContent?.trim() || '',
          content: card.textContent?.trim().slice(0, 100) || ''
        }))
        .filter(card => card.title || card.content)
        .slice(0, 10)
    }
  }

  private extractPageState(): ScreenContextData['pageState'] {
    // Extract pagination info
    const paginationInfo = this.extractPaginationInfo()
    
    // Extract active filters
    const activeFilters = this.extractActiveFilters()
    
    // Extract current tab
    const currentTab = document.querySelector('[role="tab"][aria-selected="true"]')?.textContent?.trim() || ''
    
    // Extract selected items
    const selectedItems = Array.from(document.querySelectorAll('[aria-selected="true"], .selected'))
      .map(item => item.textContent?.trim())
      .filter(Boolean)

    return {
      selectedItems,
      activeFilters,
      currentTab,
      pagination: paginationInfo
    }
  }

  private extractPaginationInfo(): { page: number; total: number } {
    // Look for pagination elements
    const paginationText = document.querySelector('[class*="pagination"], [data-testid*="pagination"]')?.textContent
    
    if (paginationText) {
      const pageMatch = paginationText.match(/page\s+(\d+)/i)
      const totalMatch = paginationText.match(/of\s+(\d+)/i)
      
      return {
        page: pageMatch ? parseInt(pageMatch[1]) : 1,
        total: totalMatch ? parseInt(totalMatch[1]) : 1
      }
    }

    return { page: 1, total: 1 }
  }

  private extractActiveFilters(): Record<string, any> {
    const filters: Record<string, any> = {}

    // Look for filter elements
    const filterElements = document.querySelectorAll('[class*="filter"], [data-testid*="filter"]')
    
    filterElements.forEach(element => {
      const label = element.querySelector('label')?.textContent?.trim()
      const input = element.querySelector('input, select')
      
      if (label && input) {
        const value = (input as HTMLInputElement).value
        if (value) {
          filters[label] = value
        }
      }
    })

    return filters
  }

  private notifyObservers(context: ScreenContextData): void {
    this.observers.forEach(observer => {
      try {
        observer(context)
      } catch (error) {
        console.error('Error notifying context observer:', error)
      }
    })
  }
}
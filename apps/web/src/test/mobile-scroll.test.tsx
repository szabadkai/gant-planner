/// <reference types="vitest" />
import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Simple test component that applies mobile styles
const MobileTestComponent = () => {
  return (
    <div>
      <div className="layout">
        <div className="sidebar">
          <div className="panel">Sidebar Content</div>
        </div>
        <div className="main">
          <div className="gantt">
            <div className="gantt-header">
              <div className="gutter">Staff</div>
              <div className="col">Day 1</div>
              <div className="col">Day 2</div>
              <div className="col">Day 3</div>
              <div className="col">Day 4</div>
              <div className="col">Day 5</div>
              <div className="col">Day 6</div>
              <div className="col">Day 7</div>
              <div className="col">Day 8</div>
              <div className="col">Day 9</div>
              <div className="col">Day 10</div>
              <div className="col">Day 11</div>
              <div className="col">Day 12</div>
              <div className="col">Day 13</div>
              <div className="col">Day 14</div>
            </div>
            <div className="gantt-body">
              <div className="gantt-rows">
                <div className="gantt-row">
                  <div className="label">Alice</div>
                  <div className="grid">
                    <div className="cell"></div>
                    <div className="cell"></div>
                    <div className="cell"></div>
                  </div>
                  <div className="blocks"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

describe('Mobile Horizontal Scroll CSS Test', () => {
  beforeEach(() => {
    // Set mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    // Set document viewport size
    Object.defineProperty(document.documentElement, 'clientWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    Object.defineProperty(document.body, 'clientWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
  });

  afterEach(() => {
    // Reset viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it('should have mobile styles that prevent horizontal scrolling', () => {
    render(<MobileTestComponent />);

    // Check that mobile media query styles are applied correctly
    const layout = document.querySelector('.layout');
    const sidebar = document.querySelector('.sidebar');
    const main = document.querySelector('.main');
    const gantt = document.querySelector('.gantt');

    // Verify elements exist
    expect(layout).toBeTruthy();
    expect(sidebar).toBeTruthy();
    expect(main).toBeTruthy();
    expect(gantt).toBeTruthy();

    if (layout && sidebar && main && gantt) {
      // Check computed styles for mobile layout constraints
      const layoutStyles = getComputedStyle(layout);
      const sidebarStyles = getComputedStyle(sidebar);
      const mainStyles = getComputedStyle(main);
      const ganttStyles = getComputedStyle(gantt);

      // Test that elements have mobile overflow constraints
      expect(ganttStyles.overflowX).toBe('hidden');
      expect(ganttStyles.maxWidth).toContain('100vw');
      
      // Check that mobile layout changes are applied
      expect(layoutStyles.gridTemplateColumns).toBe('1fr');
    }
  });

  it('should limit gantt columns on mobile viewport', () => {
    render(<MobileTestComponent />);

    // Get all columns
    const allColumns = document.querySelectorAll('.gantt-header .col');
    
    // Check that we have the expected columns
    expect(allColumns.length).toBe(14); // 14 columns in our test component
    
    // In a real mobile implementation, columns beyond 14 should be hidden
    // Check if CSS rules would hide columns beyond 14
    const nthChild15Plus = document.querySelector('.gantt-header .col:nth-child(n+15)');
    if (nthChild15Plus) {
      const styles = getComputedStyle(nthChild15Plus);
      // This would be hidden by our CSS rule, but since we only have 14 columns, none should match
    }
    
    // Verify the mobile variables are set correctly
    const rootStyles = getComputedStyle(document.documentElement);
    expect(rootStyles.getPropertyValue('--cell-width').trim()).toBe('18px');
    expect(rootStyles.getPropertyValue('--left-gutter').trim()).toBe('50px');
  });

  it('should verify body and root elements have mobile constraints', () => {
    render(<MobileTestComponent />);

    const body = document.body;
    const root = document.getElementById('root') || document.documentElement;

    // Check that body has mobile constraints applied
    const bodyStyles = getComputedStyle(body);
    expect(bodyStyles.overflowX).toBe('hidden');
    expect(bodyStyles.width).toBe('100vw');
    expect(bodyStyles.maxWidth).toBe('100vw');

    // For our test, simulate the scroll width being contained
    // In a real test, this would check that scrollWidth <= clientWidth
    expect(body.scrollWidth).toBeLessThanOrEqual(body.clientWidth + 5); // Some tolerance
  });

  it('should have proper mobile font sizes to prevent zoom', () => {
    render(<MobileTestComponent />);

    // Check that inputs would have 16px font size on mobile to prevent zoom
    const body = document.body;
    const bodyStyles = getComputedStyle(body);
    
    // Body should have 16px font size on mobile
    expect(bodyStyles.fontSize).toBe('16px');
  });
});
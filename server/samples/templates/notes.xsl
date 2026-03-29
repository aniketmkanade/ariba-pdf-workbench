<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:fo="http://www.w3.org/1999/XSL/Format">

  <xsl:output method="xml" indent="yes" encoding="UTF-8"/>

  <!-- Template to truncate description to approx 3 lines (150 chars) -->
  <xsl:template name="truncate-description">
    <xsl:param name="text"/>
    <xsl:variable name="maxChars" select="150"/>
    <xsl:choose>
      <xsl:when test="string-length($text) > $maxChars">
        <xsl:value-of select="concat(substring($text, 1, $maxChars - 3), '...')"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$text"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- Root template -->
  <xsl:template match="/Notes">
    <fo:root xmlns:fo="http://www.w3.org/1999/XSL/Format">
      <!-- Define page layout -->
      <fo:layout-master-set>
        <fo:simple-page-master master-name="notes-page" page-height="11in" page-width="8.5in"
                               margin-top="0.5in" margin-bottom="0.5in"
                               margin-left="0.5in" margin-right="0.5in">
          <fo:region-body margin-top="0.75in" margin-bottom="0.5in"/>
          <fo:region-before extent="0.75in" region-name="header"/>
          <fo:region-after extent="0.5in" region-name="footer"/>
        </fo:simple-page-master>
      </fo:layout-master-set>

      <fo:page-sequence master-reference="notes-page">
        <fo:static-content flow-name="header">
          <fo:block font-size="14pt" font-weight="bold" text-align="center">Notes</fo:block>
        </fo:static-content>
        <fo:static-content flow-name="footer">
          <fo:block text-align="center">Page <fo:page-number/></fo:block>
        </fo:static-content>
        <fo:flow flow-name="xsl-region-body">
          <xsl:for-each select="Note">
            <fo:block margin-bottom="0.25in">
              <xsl:variable name="note" select="."/>
              <xsl:variable name="hasTag" select="contains($note, '&lt;') or contains($note, '&gt;')"/>
              <fo:block font-size="10pt" max-height="3.6em" overflow="hidden">
                <xsl:if test="$hasTag">
                  <xsl:attribute name="background-color">#ffe6e6</xsl:attribute>
                </xsl:if>
                <xsl:call-template name="truncate-description">
                  <xsl:with-param name="text" select="$note"/>
                </xsl:call-template>
                <xsl:if test="$hasTag">
                  <fo:inline font-weight="bold" color="red"> ⚠️</fo:inline>
                </xsl:if>
              </fo:block>
            </fo:block>
          </xsl:for-each>
        </fo:flow>
      </fo:page-sequence>
    </fo:root>
  </xsl:template>

</xsl:stylesheet>
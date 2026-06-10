export const InputBody = {
    sites(title, domain, logo_url, primary_color, secondary_color, layout) {
        return {
            "title":           title,
            "domain":          domain,
            "logo_url":        logo_url,
            "primary_color":   primary_color,
            "secondary_color": secondary_color,
            "layout":          layout
        }
    },
    feedbacks(clientId, sessionId, eventName, resellerId, domain, siteType, rating, pages) {
        return {
            "client_id": clientId,
            "session_id": sessionId,
            "event_name": eventName,
            "reseller_id": resellerId,
            "site_domain": domain,
            "site_type": siteType,
            "rating": rating,
            "feedback": {
                "pages": pages
            }
        }
    },
    likedPages(pages) {
        return pages.map(([id, title, is_liked]) => ({
            id, title, is_liked
        }))
    },
    instances(title, message, primary_color, secondary_color, display_logo, layout, slug) {
        return {
            "title": title,
            "message": message,
            "primary_color": primary_color,
            "secondary_color": secondary_color,
            "display_logo": display_logo,
            "layout": layout,
            "slug": slug
        }
    },
    instanceLayouts(banner, title, footer, sub_footer) {
        return {
            "banner": banner,
            "title": title,
            "footer": footer,
            "sub_footer": sub_footer
        }
    },
    homepageResources(order, resource_id, version_id, resource_type) {
        return {
            "order": order,
            "resource_id": resource_id,
            "version_id": version_id,
            "resource_type": resource_type
        }
    },
    homepageVideos(order, version_id) {
        return {
            "order": order,
            "version_id": version_id
        }
    },
    instanceSettings(key, value) {
        return {
            "key": key,
            "value": value
        }
    },
    instancePages(title, description, status, icon, order, header, footer, lang, thumbnail_url, related_id) {
        return {
            "title": title,
            "description": description,
            "status": status,
            "icon": icon,
            "order": order,
            "header": header,
            "footer": footer,
            "lang": lang,
            "thumbnail_url": thumbnail_url,
            "related_id": related_id
        }
    },
    instanceButtons(title, placement, icon, button_style, class_name, text_color, background_color, order, status, type, content, property) {
        return {
            "title": title,
            "placement": placement,
            "icon": icon,
            "button_style": button_style,
            "class_name": class_name,
            "text_color": text_color,
            "background_color": background_color,
            "order": order,
            "status": status,
            "type": type,
            "content": content,
            "property": property
        }
    },
    documentsMultiple(documents) {
        return { data: documents };
    },
    imagesMultiple(images) {
        return { data: images };
    },
    video(title, description, author, duration, size, video_url, video_thumbnail_url, status) {
        return {
            "title":               title,
            "description":         description,
            "author":              author,
            "duration":            duration,
            "size":                size,
            "video_url":           video_url,
            "video_thumbnail_url": video_thumbnail_url,
            "status":              status,
            "is_global":           false,
            "open_in_external":    false
        }
    },
    calculator(title, description, url, status, is_global, order) {
        return {
            "title":       title,
            "description": description,
            "url":         url,
            "status":      status,
            "is_global":   is_global,
            "order":       order
        }
    },
    dynamicCalculator(title, calculator_element, calculator_url, is_global, version, status) {
        return {
            "title":               title,
            "calculator_element":  calculator_element,
            "calculator_url":      calculator_url,
            "is_global":           is_global,
            "version":             version,
            "status":              status
        }
    },
    instancePageCalculators(calculator_id, calculator_type, order) {
        return {
            "calculator_id":   calculator_id,
            "calculator_type": calculator_type,
            "order":           order
        }
    }
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import sanitizeHtml from 'sanitize-html'

export interface AccordionItem {
  id: string
  title: string
  description: string
  imageUrl: string
  altText: string
}

interface EventAccordionProps {
  items: AccordionItem[]
}

export default function EventAccordion({ items }: EventAccordionProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <div className="flex flex-col md:flex-row h-[600px] w-full overflow-hidden rounded-2xl shadow-xl border border-gray-800 bg-gray-900">
      {items.map((item, index) => {
        const isActive = activeIndex === index
        const sanitizedDesc = sanitizeHtml(item.description)

        return (
          <div
            key={item.id}
            className={`relative flex transition-all duration-500 ease-in-out overflow-hidden group ${
              isActive ? 'flex-[6]' : 'flex-1 cursor-pointer'
            } ${index !== items.length - 1 ? 'border-b md:border-b-0 md:border-r border-gray-800' : ''}`}
            onClick={() => setActiveIndex(index)}
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <Image
                src={item.imageUrl}
                alt={item.altText}
                fill
                className={`object-cover transition-all duration-700 ${
                  isActive ? 'scale-105' : 'scale-100 grayscale'
                } group-hover:grayscale-0`}
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              {/* Overlay */}
              <div
                className={`absolute inset-0 transition-opacity duration-500 bg-black ${
                  isActive ? 'opacity-40' : 'opacity-60 group-hover:opacity-30'
                }`}
              />
              {/* Gradient for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-end w-full h-full p-6 text-white pointer-events-none">
              <div className={`transition-all duration-500 ${isActive ? 'mb-2' : 'mb-0'}`}>
                <h3 className={`font-bold transition-all duration-500 ${
                  isActive ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl truncate'
                }`}>
                  {item.title}
                </h3>
              </div>

              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  isActive ? 'max-h-[200px] opacity-100 mt-2' : 'max-h-0 opacity-0'
                }`}
              >
                <div 
                  className="text-gray-300 text-sm md:text-base leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: sanitizedDesc }}
                />
              </div>
            </div>
            
            {/* Invisible button for accessibility */}
            <button
              className="absolute inset-0 z-20 w-full h-full"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex(index);
              }}
              aria-expanded={isActive}
              aria-label={`Show details for ${item.title}`}
            />
          </div>
        )
      })}
    </div>
  )
}
